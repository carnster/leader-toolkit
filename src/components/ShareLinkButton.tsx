import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Check, Link2, Link2Off, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ShareLinkButtonProps {
  initiativeId: string;
}

export function ShareLinkButton({ initiativeId }: ShareLinkButtonProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleShare = async () => {
    setBusy(true);
    try {
      // Reuse an existing active, unexpired link for this initiative, or create one
      const { data: existing } = await supabase
        .from("share_links" as any)
        .select("token, expires_at")
        .eq("initiative_id", initiativeId)
        .eq("revoked", false)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      let token = (existing as any)?.token;
      if (!token) {
        const { data, error } = await supabase
          .from("share_links" as any)
          .insert({ initiative_id: initiativeId })
          .select("token")
          .single();
        if (error) throw error;
        token = (data as any).token;
      }
      const url = `${window.location.origin}/share/${token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast({
        title: "Share link copied",
        description:
          "Anyone with this link can view a read-only summary for 30 days. No account needed. You can revoke it from this menu anytime.",
      });
    } catch (error) {
      toast({
        title: "Could not create share link",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("share_links" as any)
        .update({ revoked: true })
        .eq("initiative_id", initiativeId)
        .eq("revoked", false)
        .select("id");
      if (error) throw error;
      const count = ((data as any[]) ?? []).length;
      toast({
        title: count ? "Share links revoked" : "No active share links",
        description: count
          ? "Existing links stop working immediately. Share again to create a fresh one."
          : "This initiative has no active links to revoke.",
      });
    } catch (error) {
      toast({
        title: "Could not revoke",
        description:
          error instanceof Error && error.message.includes("0 rows")
            ? "Only the initiative owner can revoke share links."
            : error instanceof Error
              ? error.message
              : "Try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={busy}>
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
          {copied ? "Link Copied" : "Share"}
          <ChevronDown className="ml-2 h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleShare}>
          <Link2 className="mr-2 h-4 w-4" />
          Copy view-only link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleRevoke} className="text-destructive focus:text-destructive">
          <Link2Off className="mr-2 h-4 w-4" />
          Revoke all share links
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
