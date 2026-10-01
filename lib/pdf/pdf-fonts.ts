// The only place touching node:fs for the PDF font.
//
// Be Vietnam Pro ships with the repo (asset/fonts) and covers the full
// precomposed Vietnamese range. It is a TrueType/glyf font, which is the only
// outline format jsPDF's parser accepts — a CFF/OTF font would be rejected at
// addFont() time with no useful message.
//
// The fonts are read here, on the server, and never reach the browser: a
// client-side build would push ~246 KB of base64 into the page just to
// render one document.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { jsPDF } from "jspdf";

export const PDF_FONT_FAMILY = "BeVietnamPro";

const FONT_FILES = {
  normal: "BeVietnamPro-Regular.ttf",
  bold: "BeVietnamPro-Bold.ttf",
} as const;

export type PdfFontStyle = keyof typeof FONT_FILES;

const base64Cache = new Map<PdfFontStyle, Promise<string>>();

/**
 * asset/ is a build-time asset directory, not process.cwd()-relative in every
 * deployment: the standalone server runs from the copied app root, which the
 * dockerfile mirrors (see the asset/fonts copy in the runner stage).
 */
function fontPath(file: string): string {
  return join(process.cwd(), "asset", "fonts", file);
}

export function fontBase64(style: PdfFontStyle): Promise<string> {
  const cached = base64Cache.get(style);
  if (cached) return cached;
  const pending = readFile(fontPath(FONT_FILES[style])).then((buffer) =>
    buffer.toString("base64"),
  );
  base64Cache.set(style, pending);
  return pending;
}

export async function registerPdfFonts(doc: jsPDF): Promise<void> {
  const styles = Object.keys(FONT_FILES) as PdfFontStyle[];
  const encoded = await Promise.all(styles.map((style) => fontBase64(style)));
  styles.forEach((style, index) => {
    const file = FONT_FILES[style];
    doc.addFileToVFS(file, encoded[index]);
    doc.addFont(file, PDF_FONT_FAMILY, style);
  });
  // Both weights share one family, so every text call must set the weight
  // explicitly; default to regular.
  doc.setFont(PDF_FONT_FAMILY, "normal");
}

/** Test seam: drops cached font bytes so a suite can re-read after a reset. */
export function resetPdfFontCache(): void {
  base64Cache.clear();
}
