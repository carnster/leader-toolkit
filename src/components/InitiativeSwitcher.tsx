import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInitiatives } from "@/hooks/useInitiatives";
import { useInitiativeContext } from "@/hooks/useInitiativeContext";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import { Briefcase } from "lucide-react";

const STAGE_ROUTES = ["/decide", "/plan", "/implement", "/monitor", "/sustain", "/team", "/learning"];

interface InitiativeSwitcherProps {
  /** "desktop" (header, hidden on mobile) or "mobile" (full-width, always available). */
  variant?: "desktop" | "mobile";
}

/**
 * Shows which initiative the stage pages are operating on, and lets the user
 * change it. The initiative context is otherwise invisible (a URL param), which
 * makes it easy to edit the wrong initiative, or on mobile to have no way to set
 * one at all. The mobile variant is always available from the menu.
 */
export function InitiativeSwitcher({ variant = "desktop" }: InitiativeSwitcherProps) {
  const location = useLocation();
  const { initiatives, isLoading, isFetching, refetch } = useInitiatives();
  const { initiativeId, setInitiativeId } = useInitiativeContext();
  const { actingOrgId, membership, allOrgs } = useOrganization();
  const { toast } = useToast();
  const isMobile = variant === "mobile";
  // The id we have already refetched for once; an id that is still unknown after
  // a fresh fetch is genuinely not in the user's list.
  const refetchedForRef = useRef<string | null>(null);

  const orgOf = (initiative: unknown) =>
    ((initiative as { organization_id?: string | null }).organization_id ?? null);

  // The school this account belongs to. A network leader viewing "Whole network"
  // has no acting school, so fall back to their own membership: without this the
  // default pick below lands on whichever initiative was created most recently
  // anywhere in the network, which is usually another school's.
  const homeOrgId = actingOrgId ?? (membership as { organization_id?: string } | null)?.organization_id ?? null;

  const orgNameById = useMemo(() => {
    const names = new Map<string, string>();
    (allOrgs as { id: string; name: string }[] | undefined)?.forEach((o) => names.set(o.id, o.name));
    return names;
  }, [allOrgs]);

  // Only worth labelling when the visible list actually spans schools, which is
  // the case that makes "which school am I in" ambiguous in the first place.
  const spansSchools = useMemo(() => {
    const ids = new Set((initiatives ?? []).map((i) => orgOf(i) ?? "__none__"));
    return ids.size > 1;
  }, [initiatives]);

  const schoolLabel = (initiative: unknown) => {
    const id = orgOf(initiative);
    if (!id) return "Network";
    return orgNameById.get(id) ?? "Another school";
  };

  // When we have to choose for the user, choose one of their own school's
  // initiatives rather than whatever sorts first across the whole network.
  const defaultInitiative = () => {
    if (homeOrgId) {
      const own = initiatives.find((i) => orgOf(i) === homeOrgId);
      if (own) return own;
    }
    return initiatives[0];
  };

  // If the selected initiative is not in the visible list, fall to a sensible one
  // that is, so every page states which initiative it is showing. Two guards keep
  // valid links from being bounced: wait for the initial load, and when an id is
  // unknown, refetch once before deciding (an initiative created seconds ago is
  // not in the cached list yet).
  useEffect(() => {
    if (isLoading || isFetching || !initiatives || initiatives.length === 0) return;
    if (!initiativeId) {
      setInitiativeId(defaultInitiative().id);
      return;
    }
    const known = initiatives.some((i) => i.id === initiativeId);
    if (known) {
      refetchedForRef.current = null;
      return;
    }
    if (refetchedForRef.current !== initiativeId) {
      refetchedForRef.current = initiativeId;
      void refetch();
      return;
    }
    const fallback = defaultInitiative();
    toast({
      title: "That initiative isn't in your list",
      description: `Showing ${fallback.title} instead. Ask the owner to add you to the team if you need it.`,
    });
    setInitiativeId(fallback.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isFetching, initiatives, initiativeId, refetch, setInitiativeId, toast, homeOrgId]);

  if (initiatives.length === 0) return null;
  // Desktop switcher only appears on the stage/hub pages; the mobile menu shows
  // it everywhere so context can be set before navigating into a stage.
  if (!isMobile && !STAGE_ROUTES.includes(location.pathname)) return null;

  const current = initiatives.find((i) => i.id === initiativeId);

  const select = (
    <Select value={initiativeId || undefined} onValueChange={setInitiativeId}>
      <SelectTrigger
        className={isMobile ? "h-9 w-full border-dashed text-sm" : "h-9 w-[220px] border-dashed text-sm"}
        aria-label="Switch initiative"
      >
        <span className="flex items-center gap-2 truncate">
          <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <SelectValue placeholder="Select initiative" />
        </span>
      </SelectTrigger>
      <SelectContent>
        {initiatives.map((initiative) => (
          <SelectItem key={initiative.id} value={initiative.id}>
            <span className="flex flex-col">
              <span>{initiative.title}</span>
              {spansSchools && (
                <span className="text-xs text-muted-foreground">{schoolLabel(initiative)}</span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // In a network-wide view every school's work is legitimately in the list, so
  // the school has to be stated or there is no way to tell whose initiative is open.
  const schoolLine = spansSchools && current ? (
    <p className={isMobile ? "text-xs text-muted-foreground px-1" : "text-xs text-muted-foreground mt-0.5"}>
      {schoolLabel(current)}
    </p>
  ) : null;

  if (isMobile) {
    return (
      <div className="w-full space-y-1">
        <p className="text-xs text-muted-foreground px-1">Working on</p>
        {select}
        {schoolLine}
      </div>
    );
  }

  return (
    <div className="hidden lg:flex flex-col justify-center leading-tight">
      {select}
      {schoolLine}
    </div>
  );
}
