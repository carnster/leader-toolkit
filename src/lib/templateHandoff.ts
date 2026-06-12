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
