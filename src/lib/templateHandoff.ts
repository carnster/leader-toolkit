// Hand-off of a chosen template between Decide (brief prefill or solution
// adoption) and Plan (active-ingredient import). The key is namespaced per
// initiative so a stale choice can never bleed into a different initiative.
const templateKey = (initiativeId: string) => `templateId:${initiativeId}`;

export function setPendingTemplate(initiativeId: string, templateId: string) {
  try {
    sessionStorage.setItem(templateKey(initiativeId), templateId);
  } catch {
    // sessionStorage unavailable (private mode); the user can import from Plan manually
  }
}

export function getPendingTemplate(initiativeId: string): string | null {
  try {
    return sessionStorage.getItem(templateKey(initiativeId));
  } catch {
    return null;
  }
}

export function clearPendingTemplate(initiativeId: string) {
  try {
    sessionStorage.removeItem(templateKey(initiativeId));
    sessionStorage.removeItem("templateId"); // legacy un-namespaced key
  } catch {
    // ignore
  }
}

const PREFILLED_PREFIX = "templatePrefilled:";

/** Record that this initiative's Plan was seeded from a template (session only). */
export function markTemplatePrefilled(initiativeId: string): void {
  try {
    sessionStorage.setItem(`${PREFILLED_PREFIX}${initiativeId}`, "1");
  } catch {
    /* sessionStorage unavailable: ignore */
  }
}

export function wasTemplatePrefilled(initiativeId: string | undefined): boolean {
  if (!initiativeId) return false;
  try {
    return sessionStorage.getItem(`${PREFILLED_PREFIX}${initiativeId}`) === "1";
  } catch {
    return false;
  }
}
