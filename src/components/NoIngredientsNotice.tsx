import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { PackageOpen } from "lucide-react";

/** Shown when an initiative has reached a later stage with no active ingredients.
 *
 *  Without ingredients several features render empty rather than broken: the
 *  fidelity monitoring plan has nothing to observe against, the adaptation
 *  protocol has nothing to adapt, and a staff pulse link has no focus practice
 *  to name, so it falls back to asking about "the practice" in the abstract.
 *  Nothing errors, so a leader reads the product as thin instead of their setup
 *  as unfinished. This says which it is, and where to go. */
export function NoIngredientsNotice({ stage = "this stage" }: { stage?: string }) {
  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardContent className="pt-6 flex gap-4">
        <PackageOpen className="h-6 w-6 shrink-0 text-amber-600 dark:text-amber-500" aria-hidden="true" />
        <div className="space-y-1.5">
          <h3 className="font-semibold">No active ingredients yet</h3>
          <p className="text-sm text-muted-foreground">
            This initiative has no active ingredients, so fidelity monitoring, the adaptation protocol,
            and the staff pulse have nothing specific to point at in {stage}.
          </p>
          <p className="text-sm text-muted-foreground">
            Open{" "}
            <Link to="/plan" className="text-accent underline underline-offset-2 font-medium">
              Plan &amp; Prepare
            </Link>{" "}
            to load them from your template, or add your own there. If you already have a staff pulse
            link, rotate it afterward so it points at the focus practice.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
