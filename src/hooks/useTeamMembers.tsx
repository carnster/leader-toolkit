import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TeamMember {
  id: string;
  initiative_id: string;
  user_id: string | null;
  name: string | null;
  role_in_initiative: string;
  responsibilities: string[] | null;
  joined_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function useTeamMembers(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ["team-members", initiativeId],
    queryFn: async () => {
      if (!initiativeId) return [];
      const { data, error } = await supabase
        .from("initiative_team_members")
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq("initiative_id", initiativeId)
        .order("joined_at", { ascending: true });

      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!initiativeId,
  });

  const addTeamMember = useMutation({
    mutationFn: async (member: Partial<TeamMember>) => {
      const { data, error } = await supabase
        .from("initiative_team_members")
        .insert({
          initiative_id: initiativeId!,
          user_id: member.user_id || null,
          name: member.name || null,
          role_in_initiative: member.role_in_initiative!,
          responsibilities: member.responsibilities,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", initiativeId] });
      toast({
        title: "Team member added",
        description: "New member has been added to the team.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding team member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTeamMember = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TeamMember> & { id: string }) => {
      const { data, error } = await supabase
        .from("initiative_team_members")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", initiativeId] });
      toast({
        title: "Team member updated",
        description: "Changes have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating team member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeTeamMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("initiative_team_members")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", initiativeId] });
      toast({
        title: "Team member removed",
        description: "Member has been removed from the team.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error removing team member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    teamMembers: teamMembers || [],
    isLoading,
    addTeamMember: addTeamMember.mutate,
    updateTeamMember: updateTeamMember.mutate,
    removeTeamMember: removeTeamMember.mutate,
    isAdding: addTeamMember.isPending,
    isUpdating: updateTeamMember.isPending,
    isRemoving: removeTeamMember.isPending,
  };
}
