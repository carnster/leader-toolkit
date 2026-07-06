import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Compass } from "lucide-react";

/** Shown on a stage/hub page when no initiative is selected, so the user always
 *  has a path forward instead of an empty scaffold with dead instructions. */
export function NoInitiativeGate({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <Card className="mt-6">
        <CardContent className="pt-6 text-center space-y-3">
          <Compass className="h-10 w-10 text-muted-foreground mx-auto" aria-hidden="true" />
          <p className="text-muted-foreground">
            {sub || "Select or create an initiative to work here."} Start from the{" "}
            <Link to="/" className="text-accent underline underline-offset-2 font-medium">Dashboard</Link>{" "}
            or begin one in{" "}
            <Link to="/decide" className="text-accent underline underline-offset-2 font-medium">Decide</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
