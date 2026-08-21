import type jsPDF from "jspdf";
import impactMark from "@/assets/brand/impact-mark.png";

type Loaded = { dataUrl: string; w: number; h: number };

/** Decoded once at module load so the header stays synchronous: every export
 *  call site is sync, and a user cannot click Export faster than this resolves.
 *  If it somehow has not landed, the header omits the mark rather than throwing. */
const cache = new Map<string, Loaded>();

function load(url: string): Promise<void> {
  return fetch(url)
    .then((r) => r.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    )
    .then(
      (dataUrl) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            cache.set(url, { dataUrl, w: img.naturalWidth, h: img.naturalHeight });
            resolve();
          };
          img.onerror = () => resolve();
          img.src = dataUrl;
        })
    )
    .catch(() => undefined);
}

if (typeof window !== "undefined") {
  void load(impactMark);
}

/** Places the IMPACT mark at a given y and returns the y below it.
 *  Sizes are fractions of page width so this works whether the caller built the
 *  doc in mm (jsPDF default) or pt. */
export function brandMarks(doc: jsPDF, y: number): number {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = pageW * 0.075;
  const img = cache.get(impactMark);
  if (!img) return y;

  // Held to a modest height on purpose: the source mark is 240px wide, so
  // printing it larger drops below a sensible effective resolution.
  const scale = Math.min((pageW * 0.2) / img.w, (pageW * 0.06) / img.h);
  const w = img.w * scale;
  const h = img.h * scale;
  try {
    doc.addImage(img.dataUrl, "PNG", margin, y, w, h, undefined, "FAST");
  } catch {
    /* a bad image must never block the export */
  }
  return y + h;
}

/** Fetches an org logo for embedding in a PDF header. Only the three raster
 *  formats jsPDF's addImage understands are embedded; an SVG logo (or any
 *  fetch/decode failure) resolves to null so the header just omits it rather
 *  than blocking the export. */
export async function loadOrgLogoForPdf(
  url: string
): Promise<(Loaded & { format: "PNG" | "JPEG" | "WEBP" }) | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const format =
      blob.type === "image/jpeg" ? "JPEG" : blob.type === "image/webp" ? "WEBP" : blob.type === "image/png" ? "PNG" : null;
    if (!format) return null;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const dims = await new Promise<{ w: number; h: number } | null>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
    if (!dims) return null;
    return { dataUrl, w: dims.w, h: dims.h, format };
  } catch {
    return null;
  }
}

export interface BrandHeaderOptions {
  title: string;
  subtitle?: string;
  /** The school's own logo, placed at the top-right of the header opposite
   *  the IMPACT mark. From loadOrgLogoForPdf; omit or pass null if unavailable. */
  orgLogo?: (Loaded & { format: "PNG" | "JPEG" | "WEBP" }) | null;
}

/** Draws the branded header and returns the y position content should start at. */
export function brandedHeader(doc: jsPDF, opts: BrandHeaderOptions): number {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = pageW * 0.075;

  let y = brandMarks(doc, margin) + pageW * 0.03;

  if (opts.orgLogo) {
    const maxW = pageW * 0.18;
    const maxH = pageW * 0.05;
    const scale = Math.min(maxW / opts.orgLogo.w, maxH / opts.orgLogo.h);
    const w = opts.orgLogo.w * scale;
    const h = opts.orgLogo.h * scale;
    try {
      doc.addImage(opts.orgLogo.dataUrl, opts.orgLogo.format, pageW - margin - w, margin, w, h, undefined, "FAST");
    } catch {
      /* a bad image must never block the export */
    }
  }

  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text(opts.title, margin, y);
  y += pageW * 0.022;

  if (opts.subtitle) {
    doc.setFontSize(11);
    doc.setTextColor(90, 90, 90);
    const lines = doc.splitTextToSize(opts.subtitle, pageW - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * pageW * 0.014;
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(pageW * 0.0012);
  doc.line(margin, y, pageW - margin, y);
  doc.setTextColor(0, 0, 0);

  return y + pageW * 0.022;
}

/** Stamps "page N of M" and the generation date on every page.
 *  Call once, immediately before doc.save(). */
export function brandedFooter(doc: jsPDF, note?: string): void {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = pageW * 0.075;
  const total = doc.getNumberOfPages();
  const stamp = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(note ? `${note} · ${stamp}` : stamp, margin, pageH - margin * 0.5);
    doc.text(`Page ${i} of ${total}`, pageW - margin, pageH - margin * 0.5, {
      align: "right",
    });
  }
  doc.setTextColor(0, 0, 0);
}
