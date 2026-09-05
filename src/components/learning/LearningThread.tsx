import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { usePDActivities } from "@/hooks/usePDActivities";

export function LearningThread({ initiativeId }: { initiativeId: string | undefined }) {
  const { activities } = usePDActivities(initiativeId);
  if (!initiativeId) return null;
  const planned = activities.length;
  const completed = activities.filter((a) => a.completion_status === "completed").length;
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">The thread:</span> {planned} learning activit{planned === 1 ? "y" : "ies"} planned in{" "}
          <Link className="underline" to={`/plan?section=pd&initiative=${initiativeId}`}>Plan step 4</Link>, {completed} delivered in{" "}
          <Link className="underline" to={`/implement?section=training&initiative=${initiativeId}`}>Implement step 1</Link>. This page is the year they add up to.
        </p>
      </CardContent>
    </Card>
  );
}
