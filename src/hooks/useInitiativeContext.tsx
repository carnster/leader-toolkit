import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const STORAGE_KEY = "initiativeId";

/**
 * Single source of truth for "which initiative am I working on."
 *
 * The URL (?initiative=<id>) is canonical: it is visible, shareable, and
 * survives navigation. sessionStorage is only a convenience fallback so that
 * stage-to-stage navigation keeps context; whenever the fallback is used, the
 * URL is immediately rewritten to match, so the user can always SEE which
 * initiative the page is showing.
 */
export function useInitiativeContext() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlId = searchParams.get("initiative");
  const storedId = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;

  // Normalize: if the URL is missing the param but we have a stored id,
  // write it into the URL (replace, not push, so Back isn't polluted).
  useEffect(() => {
    if (!urlId && storedId) {
      const next = new URLSearchParams(searchParams);
      next.set("initiative", storedId);
      setSearchParams(next, { replace: true });
    }
  }, [urlId, storedId, searchParams, setSearchParams]);

  // Keep the fallback in sync with the canonical URL.
  useEffect(() => {
    if (urlId) sessionStorage.setItem(STORAGE_KEY, urlId);
  }, [urlId]);

  const initiativeId = urlId || storedId || "";

  const setInitiativeId = (id: string) => {
    sessionStorage.setItem(STORAGE_KEY, id);
    const next = new URLSearchParams(searchParams);
    next.set("initiative", id);
    setSearchParams(next, { replace: true });
  };

  return { initiativeId, setInitiativeId, hasInitiative: initiativeId !== "" };
}
