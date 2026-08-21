import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { School, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization, useOrgRoster, slugify, OrgRole, Organization } from "@/hooks/useOrganization";

interface DirectoryRow {
  school: string | null;
  email: string;
  member_role: string | null;
  member_status: string | null;
  signed_in: boolean;
}

/** Every account grouped by school. The backing function returns rows only
 *  for the network administrator, so this renders nothing for anyone else. */
function NetworkDirectory() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["network-directory"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("network_directory" as any);
      if (error) return [] as DirectoryRow[];
      return (data as DirectoryRow[]) || [];
    },
    retry: false,
  });

  if (isLoading) return <Skeleton className="h-4 w-2/3" />;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No accounts yet.</p>;

  const groups = new Map<string, DirectoryRow[]>();
  for (const r of rows) {
    const g = r.school || "No school yet";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(r);
  }

  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([school, members]) => (
        <div key={school}>
          <h4 className="text-sm font-medium">{school}</h4>
          <ul className="mt-1 space-y-1">
            {members.map((m) => (
              <li key={school + m.email} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="truncate">{m.email}</span>
                {m.member_role ? (
                  <Badge variant={m.member_role === "admin" ? "default" : "secondary"}>{m.member_role}</Badge>
                ) : null}
                {m.member_status === "pending" ? (
                  <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
                    Pending
                  </Badge>
                ) : null}
                {!m.signed_in ? (
                  <span className="text-xs text-muted-foreground">not signed in yet</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** School workspace: create or join a school, see membership status, and
 *  (for admins) manage the roster. One card, six states, degrading quietly
 *  to a placeholder until the organizations schema lands. */
export function OrganizationPanel() {
  const {
    org,
    membership,
    isAdmin,
    isPending,
    missingTable,
    isLoading,
    createOrg,
    isCreatingOrg,
    requestToJoin,
    isRequestingToJoin,
    joinRequestResult,
    leaveOrg,
    isNetworkLeader,
    allOrgs,
    selectedOrgId,
    setSelectedOrg,
    deleteOrg,
  } = useOrganization();

  const [schoolName, setSchoolName] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slug, setSlug] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);

  const handleNameChange = (value: string) => {
    setSchoolName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleCreate = () => {
    if (!schoolName.trim() || !slug.trim()) return;
    createOrg({ name: schoolName.trim(), slug: slugify(slug) });
  };

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    requestToJoin(joinCode.trim());
  };

  const handleLeave = () => {
    if (window.confirm(`Leave ${org?.name || "this school"}? You can request to rejoin later.`)) {
      leaveOrg();
    }
  };

  useEffect(() => {
    if (isNetworkLeader && allOrgs.length > 0 && !allOrgs.some((o) => o.id === selectedOrgId)) {
      setSelectedOrg(allOrgs[0].id);
    }
  }, [isNetworkLeader, allOrgs, selectedOrgId]);

  const renderCreateJoinCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <School className="h-5 w-5" aria-hidden="true" />
          School workspace
        </CardTitle>
        <CardDescription>
          Connect this account to your school so initiatives, teams, and reports live in one
          shared workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Create your school</h3>
          <div className="space-y-2">
            <Label htmlFor="school-name">School name</Label>
            <Input
              id="school-name"
              value={schoolName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Riverside Elementary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="school-slug">Join code</Label>
            <Input
              id="school-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="riverside-elementary"
            />
            <p className="text-xs text-muted-foreground">
              This is your school's join code. Share it with staff so they can request to join.
            </p>
          </div>
          <Button onClick={handleCreate} disabled={!schoolName.trim() || !slug.trim() || isCreatingOrg}>
            {isCreatingOrg ? "Creating..." : "Create school"}
          </Button>
        </div>

        <div className="space-y-3 border-t pt-6">
          <h3 className="text-sm font-medium">Join a school</h3>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter a join code"
            />
            <Button variant="outline" onClick={handleJoin} disabled={!joinCode.trim() || isRequestingToJoin}>
              {isRequestingToJoin ? "Sending..." : "Request to join"}
            </Button>
          </div>
          {joinRequestResult === "requested" && (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
              Request sent. A school admin approves new members.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (missingTable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <School className="h-5 w-5" aria-hidden="true" />
            School workspace
          </CardTitle>
          <CardDescription>This feature activates after the next database update.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <School className="h-5 w-5" aria-hidden="true" />
            School workspace
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (isNetworkLeader) {
    if (allOrgs.length === 0) {
      return renderCreateJoinCard();
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <School className="h-5 w-5" aria-hidden="true" />
            School workspace
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="acting-on-select">Acting on</Label>
            <Select value={selectedOrgId ?? undefined} onValueChange={(value) => setSelectedOrg(value)}>
              <SelectTrigger id="acting-on-select">
                <SelectValue placeholder="Choose a school" />
              </SelectTrigger>
              <SelectContent>
                {allOrgs.map((o: Organization) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              You are the network administrator. You can manage any school.
            </p>
          </div>
          {org ? <AdminRoster orgId={org.id} membershipId={membership?.id || ""} logoUrl={org.logo_url} /> : null}

          <div className="border-t pt-6">
            {showAddSchool ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Add a school</h3>
                <div className="space-y-2">
                  <Label htmlFor="new-school-name">School name</Label>
                  <Input
                    id="new-school-name"
                    value={schoolName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Riverside Elementary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-school-slug">Join code</Label>
                  <Input
                    id="new-school-slug"
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(slugify(e.target.value));
                    }}
                    placeholder="riverside-elementary"
                  />
                  <p className="text-xs text-muted-foreground">
                    Share this join code with the school's staff so they can request to join.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreate} disabled={!schoolName.trim() || !slug.trim() || isCreatingOrg}>
                    {isCreatingOrg ? "Creating..." : "Create school"}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowAddSchool(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setShowAddSchool(true)}>
                  Add a school
                </Button>
                {org ? (
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      const typed = window.prompt(
                        `Removing ${org.name} deletes its roster and join code. Its initiatives are kept and revert to their owners personally.\n\nType the school's name to confirm:`
                      );
                      if (typed !== null && typed.trim() === org.name) {
                        deleteOrg(org.id);
                      } else if (typed !== null) {
                        window.alert("The name did not match. Nothing was removed.");
                      }
                    }}
                  >
                    Remove this school
                  </Button>
                ) : null}
                <Button variant="outline" onClick={() => setShowDirectory((v) => !v)}>
                  {showDirectory ? "Hide directory" : "Network directory"}
                </Button>
              </div>
            )}
          </div>

          {showDirectory ? (
            <div className="border-t pt-6">
              <h3 className="mb-3 text-sm font-medium">Everyone, by school</h3>
              <NetworkDirectory />
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <School className="h-5 w-5" aria-hidden="true" />
            School workspace
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
            Your request to join a school is waiting for an admin to approve it.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!membership || !org) {
    return renderCreateJoinCard();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <School className="h-5 w-5" aria-hidden="true" />
              {org.logo_url && (
                <img
                  src={org.logo_url}
                  alt={org.name}
                  className="h-10 max-h-10 rounded-sm object-contain"
                />
              )}
              {org.name}
            </CardTitle>
            <CardDescription>Join code: {org.slug}</CardDescription>
          </div>
          <Badge variant={isAdmin ? "default" : "secondary"}>{isAdmin ? "Admin" : "Member"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAdmin ? (
          <AdminRoster orgId={org.id} membershipId={membership.id} logoUrl={org.logo_url} />
        ) : null}
        <div className="border-t pt-4">
          <Button variant="outline" onClick={handleLeave}>
            Leave school
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminRoster({
  orgId,
  membershipId,
  logoUrl,
}: {
  orgId: string;
  membershipId: string;
  logoUrl: string | null;
}) {
  const {
    members,
    isLoading,
    inviteByEmail,
    isInviting,
    approve,
    deny,
    remove,
    setRole,
    uploadLogo,
    isUploadingLogo,
    removeLogo,
    isRemovingLogo,
  } = useOrgRoster(orgId);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgRole>("member");
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadLogo(file);
    e.target.value = "";
  };

  const handleRemoveLogo = () => {
    if (window.confirm("Remove your school's logo?")) {
      removeLogo();
    }
  };

  const pendingCount = members.filter((m) => m.status === "pending").length;

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteByEmail({ email: inviteEmail.trim(), role: inviteRole });
    setInviteEmail("");
  };

  const handleRemove = (id: string, label: string) => {
    if (window.confirm(`Remove ${label} from this school?`)) {
      remove(id);
    }
  };

  return (
    <div className="space-y-4">
      {pendingCount > 0 && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          {pendingCount === 1 ? "1 request waiting for you" : `${pendingCount} requests waiting for you`}
        </p>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium">School logo</h3>
        {logoUrl ? (
          <div className="flex flex-wrap items-center gap-3">
            <img src={logoUrl} alt="School logo" className="h-10 max-h-10 rounded-sm border object-contain" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoInputRef.current?.click()}
              disabled={isUploadingLogo || isRemovingLogo}
            >
              {isUploadingLogo ? "Uploading..." : "Replace"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveLogo}
              disabled={isUploadingLogo || isRemovingLogo}
            >
              {isRemovingLogo ? "Removing..." : "Remove"}
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoInputRef.current?.click()}
              disabled={isUploadingLogo}
            >
              {isUploadingLogo ? "Uploading..." : "Upload logo"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Shown on your school's workspace and reports. PNG, JPG, WebP, or SVG, up to 1MB.
            </p>
          </div>
        )}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleLogoChange}
        />
      </div>

      <div className="space-y-2 border-t pt-4">
        <h3 className="text-sm font-medium">Roster</h3>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members yet.</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => {
              const label = m.profiles?.full_name || m.invited_email || "Unknown";
              const isSelf = m.id === membershipId;
              return (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{label}</p>
                    <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={m.status === "pending" ? "outline" : "secondary"}
                      className={
                        m.status === "pending"
                          ? "border-amber-500/50 text-amber-700 dark:text-amber-400"
                          : undefined
                      }
                    >
                      {m.status === "pending" ? "Pending" : "Approved"}
                    </Badge>
                    {m.status === "pending" ? (
                      <>
                        <Button size="sm" onClick={() => approve(m.id)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deny(m.id)}>
                          Decline
                        </Button>
                      </>
                    ) : !isSelf ? (
                      <>
                        <Select
                          value={m.role}
                          onValueChange={(value) => setRole({ memberId: m.id, role: value as OrgRole })}
                        >
                          <SelectTrigger className="h-8 w-[110px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="outline" onClick={() => handleRemove(m.id, label)}>
                          Remove
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2 border-t pt-4">
        <h3 className="text-sm font-medium">Invite by email</h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="name@school.org"
            className="sm:flex-1"
          />
          <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as OrgRole)}>
            <SelectTrigger className="sm:w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleInvite} disabled={!inviteEmail.trim() || isInviting}>
            {isInviting ? "Inviting..." : "Invite"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Invited staff get access the first time they sign in with this email.
        </p>
      </div>
    </div>
  );
}
