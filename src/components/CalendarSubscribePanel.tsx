import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, Copy, Check, RefreshCw, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCalendarFeed, feedUrlFor } from "@/hooks/useCalendarFeed";

/** A subscribable calendar URL, as opposed to the one-time .ics download.
 *  Calendar apps re-poll this on their own, so adding a milestone in the app
 *  reaches every subscriber without anyone re-importing anything. */
export function CalendarSubscribePanel({ initiativeId }: { initiativeId: string }) {
  const { feed, missingTable, isLoading, create, isCreating, rotate, isRotating, revoke } =
    useCalendarFeed(initiativeId);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (missingTable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarClock className="h-5 w-5" aria-hidden="true" />
            Subscribe to this calendar
          </CardTitle>
          <CardDescription>Awaiting a database update on this deployment.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const url = feed ? feedUrlFor(feed.token) : "";
  // webcal:// makes Apple Calendar and Outlook subscribe rather than download.
  const webcal = url.replace(/^https?:\/\//, "webcal://");
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Could not copy", description: "Select the link and copy it manually.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarClock className="h-5 w-5" aria-hidden="true" />
          Subscribe to this calendar
        </CardTitle>
        <CardDescription>
          A live link your calendar re-checks on its own. Milestones, PD, communications, observations,
          and open commitments appear as they are added, with no re-importing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !feed ? (
          <Button onClick={() => create()} disabled={isCreating}>
            {isCreating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
            ) : (
              <><CalendarClock className="mr-2 h-4 w-4" /> Create calendar link</>
            )}
          </Button>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-2">
              <code className="flex-1 rounded-md border bg-muted/40 px-3 py-2 text-xs break-all">{url}</code>
              <Button variant="outline" onClick={copy} className="shrink-0">
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={googleUrl} target="_blank" rel="noopener noreferrer">Add to Google Calendar</a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={webcal}>Add to Apple or Outlook</a>
              </Button>
            </div>

            <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
              <p>
                Anyone with this link can see event titles, dates, and owner names. Notes and
                commitment details are never included.
              </p>
              <p>
                Calendar apps refresh on their own schedule, often every few hours rather than
                instantly.
              </p>
              {feed.last_fetched && (
                <p>Last fetched by a calendar app on {new Date(feed.last_fetched).toLocaleString()}.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => rotate(feed.id)} disabled={isRotating}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {isRotating ? "Rotating..." : "Rotate"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => revoke(feed.id)}
              >
                <X className="mr-2 h-4 w-4" />
                Close link
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
