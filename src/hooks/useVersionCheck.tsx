import { useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

/** Offers a one-click refresh when a newer build has been deployed.
 *
 *  Single-page apps never re-download themselves during in-app navigation, so
 *  a pinned tab keeps running whatever build it booted with, for days. This
 *  compares the entry-script hash the tab booted with against the one the
 *  server is currently serving, and shows a persistent toast when they differ.
 *
 *  Checks run every five minutes and, more importantly, whenever the tab
 *  regains focus, since the moment someone returns to a stale pinned tab is
 *  exactly when the nudge is useful. Each new build is offered once; a
 *  dismissed toast returns only when yet another build ships. */
const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const ENTRY_RE = /\/assets\/index-[A-Za-z0-9_-]+\.js/;

function bootedEntry(): string | null {
  const el = document.querySelector('script[type="module"][src*="/assets/index-"]');
  const m = el?.getAttribute("src")?.match(ENTRY_RE);
  return m ? m[0] : null;
}

export function useVersionCheck() {
  const offeredFor = useRef<string | null>(null);

  useEffect(() => {
    if (!import.meta.env.PROD) return;
    const booted = bootedEntry();
    // Unexpected HTML shape (or a future bundler change): stay silent rather
    // than risk nagging every user with a false "new version" forever.
    if (!booted) return;

    let stopped = false;
    const check = async () => {
      try {
        const res = await fetch("/", { cache: "no-store", headers: { accept: "text/html" } });
        if (!res.ok || stopped) return;
        const latest = (await res.text()).match(ENTRY_RE)?.[0];
        if (!latest || latest === booted || offeredFor.current === latest) return;
        offeredFor.current = latest;
        toast({
          title: "A new version is ready",
          description: "Refresh to load it. Your saved work is untouched.",
          duration: 60 * 60 * 1000,
          action: (
            <ToastAction altText="Refresh now" onClick={() => window.location.reload()}>
              Refresh
            </ToastAction>
          ),
        });
      } catch {
        /* offline or transient; the next tick will try again */
      }
    };

    const interval = window.setInterval(check, CHECK_INTERVAL_MS);
    // A deploy can land minutes after this tab loads; one early check closes
    // the window where a brand-new session is already one build behind.
    const early = window.setTimeout(check, 30_000);
    const onFocus = () => void check();
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      window.clearInterval(interval);
      window.clearTimeout(early);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
