import { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquarePlus, Camera, Upload, X } from "lucide-react";
import html2canvas from "html2canvas";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  { value: "idea", label: "Idea / request" },
  { value: "bug", label: "Something's broken" },
  { value: "confusing", label: "Confusing / unclear" },
  { value: "praise", label: "This worked well" },
  { value: "other", label: "Other" },
];

export function FeedbackButton({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("idea");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [shot, setShot] = useState<Blob | null>(null);
  const [shotUrl, setShotUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  const setImage = (blob: Blob) => {
    if (shotUrl) URL.revokeObjectURL(shotUrl);
    setShot(blob);
    setShotUrl(URL.createObjectURL(blob));
  };
  const clearImage = () => {
    if (shotUrl) URL.revokeObjectURL(shotUrl);
    setShot(null);
    setShotUrl(null);
  };

  // Close the dialog so it isn't in the shot, capture the page, then reopen.
  // html2canvas can hang or throw on some pages; a timeout race guarantees this
  // always settles, so a failed capture can never leave the dialog stuck closed.
  const capturePage = async () => {
    setCapturing(true);
    setOpen(false);
    await new Promise((r) => setTimeout(r, 400));
    try {
      const canvas = await Promise.race([
        html2canvas(document.body, {
          useCORS: true,
          backgroundColor: getComputedStyle(document.body).backgroundColor || "#ffffff",
          scale: Math.min(window.devicePixelRatio || 1, 2),
          logging: false,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("capture timed out")), 8000)
        ),
      ]);
      await new Promise<void>((resolve) =>
        canvas.toBlob((b) => { if (b) setImage(b); resolve(); }, "image/png", 0.92)
      );
    } catch (e) {
      toast({ title: "Could not capture the page", description: "Try uploading a screenshot instead.", variant: "destructive" });
    } finally {
      setCapturing(false);
      setOpen(true);
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setImage(f);
    e.target.value = "";
  };

  const submit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      // The screenshot is a nicety; an upload that fails or throws must never
      // stop the note itself from reaching the team.
      let screenshot_path: string | null = null;
      if (shot && user) {
        try {
          const rid = (globalThis.crypto as Crypto | undefined)?.randomUUID?.()
            ?? `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const path = `${user.id}/${rid}.png`;
          const { error: upErr } = await supabase.storage
            .from("feedback-screenshots")
            .upload(path, shot, { contentType: "image/png", upsert: false });
          if (!upErr) screenshot_path = path;
        } catch { /* keep going without the screenshot */ }
      }
      const { error } = await supabase.from("pilot_feedback").insert({
        email: user?.email ?? null,
        category,
        message: message.trim(),
        page_path: location.pathname,
        screenshot_path,
      });
      if (error) {
        toast({ title: "Could not send feedback", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Thank you", description: "Your feedback was sent to the team." });
      setMessage("");
      setCategory("idea");
      clearImage();
      setOpen(false);
    } catch (e) {
      toast({
        title: "Could not send feedback",
        description: e instanceof Error ? e.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {variant === "mobile" ? (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span>Share feedback</span>
        </button>
      ) : (
        <Button variant="outline" size="icon" aria-label="Share feedback" title="Share feedback" onClick={() => setOpen(true)}>
          <MessageSquarePlus className="h-4 w-4" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={(o) => { if (!capturing) setOpen(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share feedback</DialogTitle>
            <DialogDescription>
              You are piloting the IMPACT Implementation Companion. Tell us what is working and what is not. We read every note.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback-message">Your feedback</Label>
              <Textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What happened, what you expected, or what would help..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Screenshot (optional)</Label>
              {shotUrl ? (
                <div className="relative w-fit">
                  <img src={shotUrl} alt="Attached screenshot" className="max-h-40 rounded-md border" />
                  <button
                    type="button"
                    aria-label="Remove screenshot"
                    onClick={clearImage}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={capturePage} disabled={capturing}>
                    <Camera className="h-4 w-4" />
                    {capturing ? "Capturing..." : "Capture this page"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                    Upload image
                  </Button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                "Capture this page" grabs what you see now. We also record which page you are on.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={submitting || !message.trim()}>
              {submitting ? "Sending..." : "Send feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
