import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";
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
      // Reuse an existing active link for this initiative, or create one
      const { data: existing } = await supabase
        .from("share_links" as any)
        .select("token")
        .eq("initiative_id", initiativeId)
        .eq("revoked", false)
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
        description: "Anyone with this link can view a read-only summary of this initiative. No account needed.",
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

  return (
    <Button variant="outline" onClick={handleShare} disabled={busy}>
      {copied ? <Check className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
      {copied ? "Link Copied" : "Share"}
    </Button>
  );
}
