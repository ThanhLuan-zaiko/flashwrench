// Low-level drawing primitives for the invoice PDF. Every helper is pure
// geometry on top of a jsPDF document, so the composer in invoice-pdf.ts
// reads as layout rather than as coordinate arithmetic.
import type { jsPDF } from "jspdf";
import { PDF_FONT_FAMILY } from "./pdf-fonts";

export const PAGE = {
  width: 210,
  height: 297,
  margin: 18,
} as const;

export const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2;

export const INK = {
  strong: "#18181b",
  body: "#3f3f46",
  muted: "#71717a",
  rule: "#e4e4e7",
  shade: "#fafafa",
} as const;

export type Align = "left" | "right" | "center";

export type Column = { x: number; width: number; align: Align };

// Line-item table geometry. Widths sum to CONTENT_WIDTH so the last column
// lands exactly on the right margin.
export const COLUMNS = {
  name: { x: PAGE.margin, width: 84, align: "left" },
  qty: { x: 106, width: 16, align: "right" },
  unit: { x: 126, width: 30, align: "right" },
  total: { x: 160, width: 32, align: "right" },
} as const satisfies Record<string, Column>;

export function setBold(doc: jsPDF, bold: boolean): void {
  doc.setFont(PDF_FONT_FAMILY, bold ? "bold" : "normal");
}

export function setMuted(doc: jsPDF, muted: boolean): void {
  doc.setTextColor(muted ? INK.muted : INK.body);
}

/** Draws one line inside a column, honouring its alignment. */
export function placeText(
  doc: jsPDF,
  column: Column,
  text: string,
  y: number,
): void {
  const x =
    column.align === "right"
      ? column.x + column.width
      : column.align === "center"
        ? column.x + column.width / 2
        : column.x;
  doc.text(text, x, y, { align: column.align });
}

export function drawRule(
  doc: jsPDF,
  y: number,
  color: string = INK.rule,
  width = CONTENT_WIDTH,
): void {
  const previous = doc.getDrawColor();
  doc.setDrawColor(color);
  doc.setLineWidth(0.2);
  doc.line(PAGE.margin, y, PAGE.margin + width, y);
  doc.setDrawColor(previous);
}

/** Fills a full-width band, used for the table header. */
export function drawShadedRow(doc: jsPDF, y: number, height: number): void {
  doc.setFillColor(INK.shade);
  doc.rect(PAGE.margin, y, CONTENT_WIDTH, height, "F");
  doc.setFillColor("#ffffff");
}

export function drawField(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
): void {
  setBold(doc, false);
  setMuted(doc, true);
  doc.setFontSize(8);
  doc.text(label, x, y);
  setMuted(doc, false);
  setBold(doc, true);
  doc.setFontSize(10);
  // A long name or model must wrap inside its column, not bleed past it.
  doc.text(doc.splitTextToSize(value, width), x, y + 5);
}

/**
 * Adds a page when the next block would not fit and returns the y to continue
 * from. Keeps the composer's flow logic to a single check per block.
 */
export function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed <= PAGE.height - PAGE.margin) return y;
  doc.addPage();
  return PAGE.margin;
}

/** A label/value line of the totals block, right-aligned to the margin. */
export function drawTotalLine(
  doc: jsPDF,
  label: string,
  value: string,
  y: number,
  bold: boolean,
): void {
  const left = PAGE.margin + CONTENT_WIDTH - 78;
  setBold(doc, false);
  setMuted(doc, !bold);
  doc.setFontSize(9.5);
  doc.text(label, left, y);
  setMuted(doc, false);
  setBold(doc, true);
  doc.setFontSize(bold ? 10.5 : 9.5);
  doc.text(value, PAGE.margin + CONTENT_WIDTH, y, { align: "right" });
}
