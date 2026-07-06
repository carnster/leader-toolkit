import { useLocation } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInitiatives } from "@/hooks/useInitiatives";
import { useInitiativeContext } from "@/hooks/useInitiativeContext";
import { Briefcase } from "lucide-react";

const STAGE_ROUTES = ["/decide", "/plan", "/implement", "/monitor", "/sustain", "/team"];

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
  const { initiatives } = useInitiatives();
  const { initiativeId, setInitiativeId } = useInitiativeContext();
  const isMobile = variant === "mobile";

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
