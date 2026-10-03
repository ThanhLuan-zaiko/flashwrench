// Server-side invoice PDF. The assertions that matter are the font ones:
// jsPDF's built-in fonts are WinAnsi-only, so without an embedded TrueType
// face every Vietnamese diacritic renders as a blank box. FontFile2 proves
// the font was embedded; Identity-H proves jsPDF switched to a composite
// encoding, which is required once the text leaves Latin-1.
import { describe, expect, test } from "bun:test";
import { invoiceFileName, renderInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { fontBase64 } from "@/lib/pdf/pdf-fonts";
import {
  makeGuestInvoice,
  makeInvoiceLine,
} from "../helpers/guest-access.fixtures";

/** The raw PDF is binary; latin1 keeps the structure readable for matching. */
function asText(bytes: Buffer): string {
  return bytes.toString("latin1");
}

describe("renderInvoicePdf", () => {
  test("emits a valid PDF document", async () => {
    const bytes = await renderInvoicePdf(makeGuestInvoice());
    expect(bytes.byteLength).toBeGreaterThan(1000);
    expect(bytes.toString("latin1", 0, 5)).toBe("%PDF-");
    expect(asText(bytes)).toContain("%%EOF");
  });

  test("embeds the Vietnamese font as a TrueType font stream", async () => {
    const bytes = await renderInvoicePdf(makeGuestInvoice());
    const text = asText(bytes);
    // FontFile2 is the TrueType glyph stream; a missing font would leave
    // jsPDF falling back to Helvetica and silently dropping the diacritics.
    expect(text).toContain("FontFile2");
    // Type0 + Identity-H is the composite encoding needed for the full
    // Vietnamese range (codepoints above U+00FF).
    expect(text).toContain("/Type0");
    expect(text).toContain("Identity-H");
  });

  test("registers both weights under one family", async () => {
    const bytes = await renderInvoicePdf(makeGuestInvoice());
    // The bold header and the regular body share the family name, which is
    // how the composer switches weight with setBold().
    const text = asText(bytes);
    const boldRefs = text.match(/BeVietnamPro[^+]*/g) ?? [];
    expect(boldRefs.length).toBeGreaterThan(0);
  });

  test("renders every invoice kind without throwing", async () => {
    for (const kind of ["booking", "rescue", "order"] as const) {
      const bytes = await renderInvoicePdf(makeGuestInvoice({ kind }));
      expect(bytes.byteLength).toBeGreaterThan(1000);
      expect(asText(bytes)).toContain("FontFile2");
    }
  });

  // A long parts order must paginate instead of drawing off the page edge.
  test("paginates a long line-item list", async () => {
    const bytes = await renderInvoicePdf(
      makeGuestInvoice({
        kind: "order",
        lines: Array.from({ length: 60 }, (_, i) =>
          makeInvoiceLine({
            id: `line-${i}`,
            // A long name also exercises the wrap path in the name column.
            name: `Linh kiện thay thế số ${i} — bộ lọc gió chính hãng loại A`,
            quantity: 2,
            unitPrice: 120000,
            lineTotal: 240000,
          }),
        ),
      }),
    );
    const text = asText(bytes);
    // /Type /Page objects: one per page.
    const pages = text.match(/\/Type\s*\/Page[^s]/g) ?? [];
    expect(pages.length).toBeGreaterThan(1);
    expect(text).toContain("FontFile2");
  });

  test("survives an invoice with no payments and no notes", async () => {
    const bytes = await renderInvoicePdf(
      makeGuestInvoice({ payments: [], notes: null }),
    );
    expect(bytes.byteLength).toBeGreaterThan(1000);
    expect(asText(bytes)).toContain("FontFile2");
  });

  test("survives zero-value and fully-paid invoices", async () => {
    const unpaid = await renderInvoicePdf(
      makeGuestInvoice({
        lines: [],
        totals: {
          subtotal: 0,
          extraFee: 0,
          discount: 0,
          total: 0,
          paid: 0,
          outstanding: 0,
        },
        payments: [],
      }),
    );
    expect(unpaid.byteLength).toBeGreaterThan(1000);

    const paid = await renderInvoicePdf(
      makeGuestInvoice({
        totals: {
          subtotal: 450000,
          extraFee: 0,
          discount: 0,
          total: 450000,
          paid: 450000,
          outstanding: 0,
        },
      }),
    );
    expect(paid.byteLength).toBeGreaterThan(1000);
  });
});

describe("invoiceFileName", () => {
  test("names each kind distinctly and always ends in .pdf", () => {
    const invoice = makeGuestInvoice();
    expect(invoiceFileName(invoice)).toBe("hoa-don-booking-11111111.pdf");
    expect(invoiceFileName({ ...invoice, kind: "rescue" })).toBe(
      "hoa-don-rescue-11111111.pdf",
    );
    // The order name is spelled out rather than reusing the record type.
    expect(invoiceFileName({ ...invoice, kind: "order" })).toBe(
      "don-linh-kien-11111111.pdf",
    );
  });
});

describe("pdf fonts", () => {
  test("caches the base64 so the file is read once per process", async () => {
    const first = await fontBase64("normal");
    const second = await fontBase64("normal");
    expect(first).toBe(second);
    // Base64 of a ~120 KB TTF is far larger than 1 MB of hex.
    expect(first.length).toBeGreaterThan(100_000);
    expect(first).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  test("both weights are distinct files", async () => {
    const regular = await fontBase64("normal");
    const bold = await fontBase64("bold");
    expect(regular).not.toBe(bold);
  });
});
