import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, Copy, Check, RefreshCw, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";
import { usePulseLinks } from "@/hooks/usePulseLinks";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";

interface PulseSharePanelProps {
  initiativeId: string;
}

export function PulseSharePanel({ initiativeId }: PulseSharePanelProps) {
  const { toast } = useToast();
  const { link, isLoading, create, isCreating, revoke, rotate, isRotating } = usePulseLinks(initiativeId);
  const { activeIngredients } = useActiveIngredients(initiativeId);
  const [copied, setCopied] = useState(false);

  const focusIngredient = useMemo(
    () => activeIngredients.find((i: any) => i.is_core ?? i.isCore) ?? activeIngredients[0] ?? null,
    [activeIngredients]
  );
  const focusId = focusIngredient?.id ?? null;

  const url = link ? `${window.location.origin}/p/${link.token}` : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast({ title: "Link copied" });
    } catch {
      toast({ title: "Could not copy", description: "Copy it from the field.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle>Share the pulse with staff</CardTitle>
        </div>
        <CardDescription>
          Anyone with the link can send a pulse, no account needed. Rotate it anytime to close the old one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {focusIngredient && (
          <div className="mb-4 rounded-lg border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Staff will be asked about</p>
            <p className="text-sm font-medium mt-0.5">{focusIngredient.name}</p>
          </div>
        )}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading link...</p>
        ) : !link ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">No staff link yet. Create one to open the pulse to your whole staff.</p>
            <Button onClick={() => create(focusId)} disabled={isCreating}>
              <Link2 className="mr-2 h-4 w-4" /> {isCreating ? "Creating..." : "Create staff link"}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-center">
            <div className="space-y-3 min-w-0">
              <div className="flex gap-2">
                <div className="flex-1 min-w-0 rounded-md border bg-background px-3 py-2 font-mono text-sm truncate" title={url}>
                  {url}
                </div>
                <Button variant="outline" size="sm" onClick={copy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => rotate({ currentId: link.id, activeIngredientId: focusId })} disabled={isRotating}>
                  <RefreshCw className="mr-1 h-3.5 w-3.5" /> Rotate
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => revoke(link.id)}>
                  <X className="mr-1 h-3.5 w-3.5" /> Close link
                </Button>
              </div>
            </div>
            <div className="rounded-lg border bg-white p-2 justify-self-start">
              <QRCodeSVG value={url} size={92} bgColor="#ffffff" fgColor="#0C2454" level="M" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
