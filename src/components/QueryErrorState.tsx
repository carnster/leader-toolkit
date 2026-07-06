import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QueryErrorStateProps {
  title?: string;
  onRetry?: () => void;
}

// A failed read must never masquerade as an empty account: showing a
// "no data" empty state over a populated workspace invites duplicate
// data entry. Render this distinctly instead.
export function QueryErrorState({ title = "We could not load this", onRetry }: QueryErrorStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="font-semibold">{title}</p>
        <p className="max-w-md text-sm text-muted-foreground">
          This looks like a connection problem, not missing data. Check your
          connection and try again.
        </p>
        <Button
          variant="outline"
          onClick={() => (onRetry ? onRetry() : window.location.reload())}
        >
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}
