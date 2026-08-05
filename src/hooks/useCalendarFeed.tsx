import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isMissingTable } from "@/lib/missingTable";

export interface CalendarFeed {
  id: string;
  initiative_id: string;
  token: string;
  revoked: boolean;
  last_fetched: string | null;
  created_at: string;
}

export function feedUrlFor(token: string): string {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-feed?token=${token}`;
}

export function useCalendarFeed(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const key = ["calendar-feed", initiativeId];

  const { data, isLoading } = useQuery({
    queryKey: key,
    enabled: !!initiativeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_feeds" as any)
        .select("*")
        .eq("initiative_id", initiativeId!)
        .eq("revoked", false)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) {
        if (isMissingTable(error)) return { missingTable: true, feed: null };
        throw error;
      }
      const rows = (data as unknown as CalendarFeed[]) || [];
      return { missingTable: false, feed: rows[0] ?? null };
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("calendar_feeds" as any)
        .insert({ initiative_id: initiativeId })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CalendarFeed;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast({
        title: "Calendar link ready",
        description: "Subscribe in Google, Apple, or Outlook and it stays up to date on its own.",
      });
    },
    onError: (e: Error) =>
      toast({ title: "Could not create the calendar link", description: e.message, variant: "destructive" }),
  });

  const rotate = useMutation({
    mutationFn: async (currentId: string) => {
      await supabase.from("calendar_feeds" as any).update({ revoked: true }).eq("id", currentId);
      const { data, error } = await supabase
        .from("calendar_feeds" as any)
        .insert({ initiative_id: initiativeId })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CalendarFeed;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast({
        title: "New calendar link issued",
        description: "Anyone still subscribed to the old link will stop receiving updates.",
      });
    },
    onError: (e: Error) =>
      toast({ title: "Could not rotate the link", description: e.message, variant: "destructive" }),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("calendar_feeds" as any)
        .update({ revoked: true })
        .eq("id", id)
        .select();
      if (error) throw error;
      if (!data || (data as unknown[]).length === 0) {
        throw new Error("Only the initiative owner or team can do this.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast({ title: "Calendar link closed", description: "Subscribed calendars will stop updating." });
    },
    onError: (e: Error) =>
      toast({ title: "Could not close the link", description: e.message, variant: "destructive" }),
  });

  return {
    feed: data?.feed ?? null,
    missingTable: data?.missingTable ?? false,
    isLoading,
    create: create.mutate,
    isCreating: create.isPending,
    rotate: rotate.mutate,
    isRotating: rotate.isPending,
    revoke: revoke.mutate,
  };
}
