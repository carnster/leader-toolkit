import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInitiatives } from "@/hooks/useInitiatives";
import { useInitiativeContext } from "@/hooks/useInitiativeContext";
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
  const { toast } = useToast();
  const isMobile = variant === "mobile";
  // The id we have already refetched for once; an id that is still unknown after
  // a fresh fetch is genuinely not in the user's list.
  const refetchedForRef = useRef<string | null>(null);

  // If the selected initiative is not in the visible list, fall to the first one
  // that is, so every page states which initiative it is showing. Two guards keep
  // valid links from being bounced: wait for the initial load, and when an id is
  // unknown, refetch once before deciding (an initiative created seconds ago is
  // not in the cached list yet).
  useEffect(() => {
    if (isLoading || isFetching || !initiatives || initiatives.length === 0) return;
    if (!initiativeId) {
      setInitiativeId(initiatives[0].id);
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
    toast({
      title: "That initiative isn't in your list",
      description: `Showing ${initiatives[0].title} instead. Ask the owner to add you to the team if you need it.`,
    });
    setInitiativeId(initiatives[0].id);
  }, [isLoading, isFetching, initiatives, initiativeId, refetch, setInitiativeId, toast]);

  if (initiatives.length === 0) return null;
  // Desktop switcher only appears on the stage/hub pages; the mobile menu shows
  // it everywhere so context can be set before navigating into a stage.
  if (!isMobile && !STAGE_ROUTES.includes(location.pathname)) return null;

  const select = (
    <Select value={initiativeId || undefined} onValueChange={setInitiativeId}>
      <SelectTrigger
        className={isMobile ? "h-9 w-full border-dashed text-sm" : "h-9 w-[180px] border-dashed text-sm"}
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
            {initiative.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (isMobile) {
    return (
      <div className="w-full space-y-1">
        <p className="text-xs text-muted-foreground px-1">Working on</p>
        {select}
      </div>
    );
  }

  return <div className="hidden lg:flex items-center">{select}</div>;
}
