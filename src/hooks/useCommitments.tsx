import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isMissingTable } from "@/lib/missingTable";

export type CommitmentSource = "manual" | "pulse" | "observation" | "coaching" | "meeting";
export type CommitmentStatus = "open" | "done" | "dropped";

export interface Commitment {
  id: string;
  initiative_id: string;
  title: string;
  details: string | null;
  source: CommitmentSource;
  source_id: string | null;
  owner_member_id: string | null;
  owner_name: string | null;
  due_date: string | null;
  status: CommitmentStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface NewCommitment {
  title: string;
  details?: string | null;
  source?: CommitmentSource;
  source_id?: string | null;
  owner_member_id?: string | null;
  owner_name?: string | null;
  due_date?: string | null;
}

/** The loop-closing primitive: any signal (pulse flag, observation follow-up,
 *  coaching next step, meeting action) becomes a small tracked promise. */
export function useCommitments(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const key = ["commitments", initiativeId];

  const { data, isLoading, error } = useQuery({
    queryKey: key,
    enabled: !!initiativeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commitments" as any)
        .select("*")
        .eq("initiative_id", initiativeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as Commitment[]) || [];
    },
    retry: (failureCount, err) => !isMissingTable(err) && failureCount < 2,
  });

  const create = useMutation({
    mutationFn: async (input: NewCommitment) => {
      const { data, error } = await supabase
        .from("commitments" as any)
        .insert({
          initiative_id: initiativeId,
          title: input.title.trim(),
          details: input.details?.trim() || null,
          source: input.source || "manual",
          source_id: input.source_id || null,
          owner_member_id: input.owner_member_id || null,
          owner_name: input.owner_name?.trim() || null,
          due_date: input.due_date || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Commitment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast({ title: "Commitment logged", description: "It stays on the list until someone closes it." });
    },
    onError: (e: Error & { code?: string }) => {
      // The commitments_one_per_signal index backs the client-side dedupe:
      // a race (two tabs, double-click) surfaces here as 23505 and simply
      // means someone else logged it first. Not an error worth alarming over.
      if (e.code === "23505") {
        queryClient.invalidateQueries({ queryKey: key });
        toast({ title: "Already logged", description: "This one is on the commitments list already." });
        return;
      }
      toast({ title: "Could not log the commitment", description: e.message, variant: "destructive" });
    },
  });

  const setStatus = useMutation({
    mutationFn: async (input: { id: string; status: CommitmentStatus }) => {
      const { data, error } = await supabase
        .from("commitments" as any)
        .update({
          status: input.status,
          resolved_at: input.status === "open" ? null : new Date().toISOString(),
        })
        .eq("id", input.id)
        .select();
      if (error) throw error;
      if (!data || (data as unknown[]).length === 0) throw new Error("Only the initiative owner or team can do this.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    onError: (e: Error) => toast({ title: "Could not update the commitment", description: e.message, variant: "destructive" }),
  });

  const commitments = data || [];
  return {
    commitments,
    open: commitments.filter((c) => c.status === "open"),
    isLoading,
    error,
    missingTable: isMissingTable(error),
    create: create.mutate,
    createAsync: create.mutateAsync,
    isCreating: create.isPending,
    setStatus: setStatus.mutate,
  };
}
