import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isMissingTable } from "@/lib/missingTable";

const SELECTED_ORG_STORAGE_KEY = "network-leader-selected-org";

/** Sentinel stored in `selectedOrgId` (same localStorage key, same setter)
 *  when the network administrator picks "Whole network" instead of a
 *  specific school. It never matches a real organization id, so `selectedOrg`
 *  resolves to null and every acting-scope check below falls through to the
 *  unfiltered, network-wide behavior. */
export const WHOLE_NETWORK_VALUE = "__network__";

const DISTRICT_ACTING_STORAGE_KEY = "district-admin-selected-org";

/** Sentinel stored in `actingDistrictOrgId` when a district administrator
 *  picks the district itself instead of one of its schools. Mirrors
 *  WHOLE_NETWORK_VALUE's role for the network switcher. */
export const DISTRICT_ITSELF_VALUE = "__district__";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand: Record<string, unknown> | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  /** Null for a standalone school or for a district itself. Set to the
   *  district's id for a school that belongs to one. Undefined (not null)
   *  in an environment where the column doesn't exist yet; always read
   *  through `?? null` rather than assumed present. */
  parent_id: string | null;
}

export type OrgRole = "admin" | "member";
export type OrgMemberStatus = "pending" | "approved";

export interface OrganizationMembership {
  id: string;
  organization_id: string;
  user_id: string | null;
  invited_email: string | null;
  role: OrgRole;
  status: OrgMemberStatus;
  created_at: string;
  updated_at: string;
  organizations: Organization;
}

/** Turns a school's name into its join code: lowercase, hyphenated, capped
 *  at a length someone can still read off a whiteboard or type from memory. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

/** Looks up the current user's first approved organization membership.
 *  For call sites that only need the id (stamping a new initiative) and
 *  would otherwise have to thread the whole hook through their component.
 *  A missing table, a signed-out user, or no membership all resolve to
 *  null here: none of those is an error worth surfacing at a creation
 *  call site, they just mean the initiative stays personal. */
export async function getMyOrgId(client: SupabaseClient): Promise<string | null> {
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) return null;
  const { data, error } = await (client.from("organization_members") as any)
    .select("organization_id")
    .eq("user_id", userData.user.id)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data.organization_id as string;
}

const JOIN_MESSAGES: Record<string, { title: string; description: string }> = {
  requested: { title: "Request sent", description: "A school admin approves new members." },
  "not found": { title: "School not found", description: "No school uses that join code. Double check it with your admin." },
  "already requested or member": { title: "Already connected", description: "You already belong to this school, or a request is already waiting." },
  "not signed in": { title: "Not signed in", description: "Please sign in before requesting to join a school." },
};

/** The current user's school workspace: their organization (if any), their
 *  membership, and the actions to create, join, or leave one. Single-org
 *  assumption for v1: if a user somehow holds more than one approved
 *  membership, the first one (by join date) wins. */
export function useOrganization() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const key = ["organization", user?.id];

  const { data, isLoading, error } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_members" as any)
        .select("*, organizations(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as unknown as OrganizationMembership[]) || [];
    },
    retry: (failureCount, err) => !isMissingTable(err) && failureCount < 2,
  });

  const memberships = data || [];
  const membership = memberships.find((m) => m.status === "approved") || null;
  const pendingMembership = memberships.find((m) => m.status === "pending") || null;

  /** Whether this account holds the network superadmin role. False (never
   *  an error state) until the backing RPC exists, so a pre-paste
   *  environment behaves exactly as it does today. */
  const networkLeaderKey = ["network-leader", user?.id];
  const { data: isNetworkLeader = false } = useQuery({
    queryKey: networkLeaderKey,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_network_leader" as any);
      if (error) return false;
      return !!data;
    },
    retry: false,
  });

  const allOrgsKey = ["all-organizations", user?.id];
  const { data: allOrgs = [] } = useQuery({
    queryKey: allOrgsKey,
    enabled: !!user && isNetworkLeader,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations" as any)
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data as unknown as Organization[]) || [];
    },
    retry: (failureCount, err) => !isMissingTable(err) && failureCount < 2,
  });

  const [selectedOrgId, setSelectedOrgIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(SELECTED_ORG_STORAGE_KEY);
  });

  const setSelectedOrg = (id: string) => {
    setSelectedOrgIdState(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SELECTED_ORG_STORAGE_KEY, id);
    }
  };

  const selectedOrg = isNetworkLeader
    ? allOrgs.find((o) => o.id === selectedOrgId) || null
    : null;

  /** Every org this user is an approved admin of, top level and school
   *  alike. A district admin's district id lives in here. */
  const myAdminOrgIds = memberships
    .filter((m) => m.status === "approved" && m.role === "admin")
    .map((m) => m.organization_id);

  /** Schools belonging to any district this user administers. A missing
   *  parent_id column (pre-paste environment) or any other query error just
   *  yields an empty list rather than throwing, so district features quietly
   *  do not appear instead of breaking the panel. */
  const districtSchoolsKey = ["district-schools", user?.id, ...myAdminOrgIds];
  const { data: districtSchools = [] } = useQuery({
    queryKey: districtSchoolsKey,
    enabled: !!user && myAdminOrgIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations" as any)
        .select("*")
        .in("parent_id", myAdminOrgIds)
        .order("name", { ascending: true });
      if (error) return [];
      return ((data as unknown as Organization[]) || []).map((o) => ({
        ...o,
        parent_id: o.parent_id ?? null,
      }));
    },
    retry: false,
  });

  /** The org this user administers that is a district, i.e. has at least
   *  one school reporting to it among districtSchools. Null for an admin
   *  whose org(s) have no children, so ordinary school admins see no
   *  district UI at all. */
  const myAdminOrgs = memberships
    .filter((m) => m.status === "approved" && m.role === "admin")
    .map((m) => m.organizations);
  const districtParentIds = new Set(districtSchools.map((s) => s.parent_id).filter((id): id is string => !!id));
  const managedDistrict = myAdminOrgs.find((o) => districtParentIds.has(o.id)) || null;
  const isDistrictAdmin = !!managedDistrict;

  const [actingDistrictOrgId, setActingDistrictOrgIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(DISTRICT_ACTING_STORAGE_KEY);
  });

  const setDistrictActingOrg = (id: string) => {
    setActingDistrictOrgIdState(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISTRICT_ACTING_STORAGE_KEY, id);
    }
  };

  const selectedDistrictSchool = isDistrictAdmin
    ? districtSchools.find((s) => s.id === actingDistrictOrgId) || null
    : null;
  const isDistrictItselfSelected = isDistrictAdmin && actingDistrictOrgId === DISTRICT_ITSELF_VALUE;
  const actingAsDistrictAdmin = isDistrictAdmin && (!!selectedDistrictSchool || isDistrictItselfSelected);

  const createOrg = useMutation({
    mutationFn: async ({ name, slug, parentId }: { name: string; slug: string; parentId?: string }) => {
      if (!user) throw new Error("Not signed in.");
      const insertPayload: Record<string, unknown> = { name: name.trim(), slug: slug.trim(), created_by: user.id };
      if (parentId) insertPayload.parent_id = parentId;
      const { data, error } = await supabase
        .from("organizations" as any)
        .insert(insertPayload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: allOrgsKey });
      queryClient.invalidateQueries({ queryKey: ["district-schools"] });
      toast({
        title: "School created",
        description: "You are set as the admin. Share the join code with your staff.",
      });
    },
    onError: (e: Error) => {
      toast({ title: "Could not create the school", description: e.message, variant: "destructive" });
    },
  });

  const requestToJoin = useMutation({
    mutationFn: async (slug: string) => {
      const { data, error } = await supabase.rpc("request_to_join_org" as any, { _slug: slug.trim() });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: key });
      const msg = JOIN_MESSAGES[result] || { title: "Join request", description: result };
      toast({ title: msg.title, description: msg.description });
    },
    onError: (e: Error) => {
      toast({ title: "Could not send the request", description: e.message, variant: "destructive" });
    },
  });

  const deleteOrg = useMutation({
    mutationFn: async (orgId: string) => {
      const { error } = await supabase
        .from("organizations" as any)
        .delete()
        .eq("id", orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: allOrgsKey });
      toast({
        title: "School removed",
        description: "Its memberships were removed too. Its initiatives were kept and now belong to their owners personally.",
      });
    },
    onError: (e: Error) => {
      toast({ title: "Could not remove the school", description: e.message, variant: "destructive" });
    },
  });

  const leaveOrg = useMutation({
    mutationFn: async () => {
      if (!membership) throw new Error("No membership to leave.");
      const { error } = await supabase
        .from("organization_members" as any)
        .delete()
        .eq("id", membership.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast({
        title: "Left the school",
        description: "This account is no longer connected to that workspace.",
      });
    },
    onError: (e: Error) => {
      toast({ title: "Could not leave the school", description: e.message, variant: "destructive" });
    },
  });

  const isWholeNetworkSelected = isNetworkLeader && selectedOrgId === WHOLE_NETWORK_VALUE;
  const actingAsNetworkLeader = isNetworkLeader && (!!selectedOrg || isWholeNetworkSelected);

  /** The school the network administrator, or a district administrator, is
   *  acting on, for callers that need to scope a query to it. Null for
   *  everyone else, and null when "Whole network" or the district itself is
   *  chosen, since those are the unfiltered views. Network acting wins if an
   *  account somehow holds both roles. */
  const actingOrgId = actingAsNetworkLeader && selectedOrg
    ? selectedOrg.id
    : !isNetworkLeader && actingAsDistrictAdmin && selectedDistrictSchool
    ? selectedDistrictSchool.id
    : null;

  const org = actingAsNetworkLeader
    ? selectedOrg
    : !isNetworkLeader && actingAsDistrictAdmin
    ? selectedDistrictSchool || managedDistrict
    : membership?.organizations || null;

  const isAdmin = actingAsNetworkLeader
    ? true
    : !isNetworkLeader && actingAsDistrictAdmin
    ? true
    : membership?.role === "admin";

  return {
    org,
    membership,
    isAdmin,
    isPending: !!pendingMembership,
    pendingMembership,
    missingTable: isMissingTable(error),
    isLoading,
    createOrg: createOrg.mutate,
    isCreatingOrg: createOrg.isPending,
    requestToJoin: requestToJoin.mutate,
    isRequestingToJoin: requestToJoin.isPending,
    joinRequestResult: requestToJoin.data as string | undefined,
    leaveOrg: leaveOrg.mutate,
    isLeavingOrg: leaveOrg.isPending,
    deleteOrg: deleteOrg.mutate,
    isDeletingOrg: deleteOrg.isPending,
    isNetworkLeader,
    actingOrgId,
    allOrgs,
    selectedOrgId,
    setSelectedOrg,
    isDistrictAdmin,
    managedDistrict,
    districtSchools,
    actingDistrictOrgId,
    setDistrictActingOrg,
  };
}

const LOGO_MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};
const MAX_LOGO_BYTES = 1024 * 1024;

/** True when a storage error means the bucket itself does not exist yet.
 *  Narrow on purpose: a real, post-migration storage error (bad path, RLS
 *  denial) should still surface as an error, not be swallowed as "not ready". */
function isMissingBucket(error: unknown): boolean {
  if (!error) return false;
  const e = error as { message?: string; error?: string };
  const msg = `${e.message || ""} ${e.error || ""}`.toLowerCase();
  return msg.includes("bucket not found") || msg.includes("not found");
}

export interface OrgRosterMember {
  id: string;
  organization_id: string;
  user_id: string | null;
  invited_email: string | null;
  role: OrgRole;
  status: OrgMemberStatus;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string | null } | null;
}

/** Admin-facing roster for one organization: who is on it, who is waiting
 *  to be let in, and the actions to invite, approve, deny, remove, or
 *  re-role a member. RLS enforces admin-only writes; this hook just calls
 *  through and lets a denied write surface as a normal error toast. */
export function useOrgRoster(orgId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const key = ["organization-roster", orgId];

  const { data, isLoading, error } = useQuery({
    queryKey: key,
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_members" as any)
        .select("*, profiles(full_name)")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as unknown as OrgRosterMember[]) || [];
    },
    retry: (failureCount, err) => !isMissingTable(err) && failureCount < 2,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: key });
    queryClient.invalidateQueries({ queryKey: ["organization"] });
  };

  const inviteByEmail = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: OrgRole }) => {
      const { error } = await supabase
        .from("organization_members" as any)
        .insert({
          organization_id: orgId,
          invited_email: email.trim().toLowerCase(),
          role,
          status: "approved",
          user_id: null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({
        title: "Invite sent",
        description: "They get access the first time they sign in with that email.",
      });
    },
    onError: (e: Error) => {
      toast({ title: "Could not send the invite", description: e.message, variant: "destructive" });
    },
  });

  const approve = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("organization_members" as any)
        .update({ status: "approved" })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Member approved" });
    },
    onError: (e: Error) => {
      toast({ title: "Could not approve the request", description: e.message, variant: "destructive" });
    },
  });

  const deny = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("organization_members" as any)
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Request declined" });
    },
    onError: (e: Error) => {
      toast({ title: "Could not decline the request", description: e.message, variant: "destructive" });
    },
  });

  const remove = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("organization_members" as any)
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Member removed" });
    },
    onError: (e: Error) => {
      toast({ title: "Could not remove the member", description: e.message, variant: "destructive" });
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: OrgRole }) => {
      const { error } = await supabase
        .from("organization_members" as any)
        .update({ role })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Role updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Could not update the role", description: e.message, variant: "destructive" });
    },
  });

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const ext = LOGO_MIME_EXT[file.type];
      if (!ext) {
        throw new Error("Please choose a PNG, JPG, WebP, or SVG image.");
      }
      if (file.size > MAX_LOGO_BYTES) {
        throw new Error("That image is larger than 1MB. Please choose a smaller file.");
      }
      if (!orgId) throw new Error("No school selected.");

      const path = `${orgId}/logo.${ext}`;
      const { error: uploadError } = await (supabase.storage as any)
        .from("org-logos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) {
        if (isMissingBucket(uploadError)) throw { missingBucket: true };
        throw uploadError;
      }

      const { data: publicUrlData } = (supabase.storage as any).from("org-logos").getPublicUrl(path);
      const logoUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("organizations" as any)
        .update({ logo_url: logoUrl } as any)
        .eq("id", orgId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Logo updated", description: "Your school's logo is live on the workspace." });
    },
    onError: (e: any) => {
      if (e?.missingBucket) {
        toast({ title: "Logo upload activates after the next database update." });
        return;
      }
      toast({
        title: "Could not upload the logo",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const removeLogo = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No school selected.");

      const { data: files, error: listError } = await (supabase.storage as any)
        .from("org-logos")
        .list(orgId);
      if (listError) {
        if (isMissingBucket(listError)) throw { missingBucket: true };
        throw listError;
      }
      if (files && files.length > 0) {
        const { error: removeError } = await (supabase.storage as any)
          .from("org-logos")
          .remove(files.map((f: { name: string }) => `${orgId}/${f.name}`));
        if (removeError) {
          if (isMissingBucket(removeError)) throw { missingBucket: true };
          throw removeError;
        }
      }

      const { error: updateError } = await supabase
        .from("organizations" as any)
        .update({ logo_url: null } as any)
        .eq("id", orgId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Logo removed" });
    },
    onError: (e: any) => {
      if (e?.missingBucket) {
        toast({ title: "Logo upload activates after the next database update." });
        return;
      }
      toast({
        title: "Could not remove the logo",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  return {
    members: data || [],
    isLoading,
    missingTable: isMissingTable(error),
    inviteByEmail: inviteByEmail.mutate,
    isInviting: inviteByEmail.isPending,
    approve: approve.mutate,
    deny: deny.mutate,
    remove: remove.mutate,
    setRole: setRole.mutate,
    uploadLogo: uploadLogo.mutate,
    isUploadingLogo: uploadLogo.isPending,
    removeLogo: removeLogo.mutate,
    isRemovingLogo: removeLogo.isPending,
  };
}

export interface OrgInitiative {
  id: string;
  title: string;
  status: string;
  owner_id: string;
  organization_id: string | null;
  created_at: string;
  owner_name: string | null;
}

/** Admin-facing initiative list: every initiative an admin can act on, with
 *  its owner's name resolved client-side (a profile miss just renders as
 *  "Unknown" rather than failing the whole list). `networkWide` fetches
 *  every initiative the network role can see; otherwise the list is scoped
 *  to one school. Deleting cascades all of that initiative's data at the
 *  database level, so the confirm step lives in the component. */
export function useOrgInitiatives(opts: { orgId: string | null; networkWide: boolean }) {
  const { orgId, networkWide } = opts;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const key = ["org-initiatives", networkWide ? "all" : orgId];

  const { data, isLoading, error } = useQuery({
    queryKey: key,
    enabled: networkWide || !!orgId,
    queryFn: async () => {
      let query = supabase
        .from("initiatives" as any)
        .select("id,title,status,owner_id,organization_id,created_at")
        .order("created_at", { ascending: false });
      if (!networkWide) {
        query = query.eq("organization_id", orgId!);
      }
      const { data, error } = await query;
      if (error) throw error;
      const initiatives = (data as unknown as Omit<OrgInitiative, "owner_name">[]) || [];

      const ownerIds = [...new Set(initiatives.map((i) => i.owner_id).filter(Boolean))];
      let namesByOwnerId = new Map<string, string | null>();
      if (ownerIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles" as any)
          .select("id, full_name")
          .in("id", ownerIds);
        if (!profilesError && profiles) {
          namesByOwnerId = new Map(
            (profiles as unknown as { id: string; full_name: string | null }[]).map((p) => [p.id, p.full_name])
          );
        }
      }

      return initiatives.map((i) => ({ ...i, owner_name: namesByOwnerId.get(i.owner_id) ?? null }));
    },
    retry: (failureCount, err) => !isMissingTable(err) && failureCount < 2,
  });

  const deleteInitiative = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("initiatives" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: ["initiatives"] });
      toast({ title: "Initiative deleted", description: "All of its data was removed." });
    },
    onError: (e: Error) => {
      toast({ title: "Could not delete the initiative", description: e.message, variant: "destructive" });
    },
  });

  return {
    initiatives: data || [],
    isLoading,
    missingTable: isMissingTable(error),
    deleteInitiative: deleteInitiative.mutate,
    isDeletingInitiative: deleteInitiative.isPending,
  };
}
