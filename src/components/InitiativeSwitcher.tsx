import { useLocation } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInitiatives } from "@/hooks/useInitiatives";
import { useInitiativeContext } from "@/hooks/useInitiativeContext";
import { Briefcase } from "lucide-react";

const STAGE_ROUTES = ["/decide", "/plan", "/implement", "/monitor", "/sustain", "/team"];

/**
 * Header control showing which initiative the stage pages are operating on.
 * The initiative context is otherwise invisible (URL param), which makes it
 * easy to edit the wrong initiative without noticing.
 */
export function InitiativeSwitcher() {
  const location = useLocation();
  const { initiatives } = useInitiatives();
  const { initiativeId, setInitiativeId } = useInitiativeContext();

  if (!STAGE_ROUTES.includes(location.pathname) || initiatives.length === 0) {
    return null;
  }

  return (
    <div className="hidden lg:flex items-center">
      <Select value={initiativeId || undefined} onValueChange={setInitiativeId}>
        <SelectTrigger
          className="h-9 w-[180px] border-dashed text-sm"
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
    </div>
  );
}
