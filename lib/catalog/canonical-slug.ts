import { normalizeSlug } from "./catalog-validation";

// Route params may arrive percent-encoded, and a malformed sequence must not
// throw while rendering a page.
export function decodeSlugParam(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

// Stored slugs are always lowercase, so a typed or pasted `/products/AC-QUY`
// points at the same record. Returns the lookup form of a route param.
export function canonicalSlug(raw: string): string {
  return normalizeSlug(decodeSlugParam(raw));
}

// True when the URL should be rewritten to its canonical form. Compares decoded
// values, so an encoded but already canonical slug never redirects to itself.
export function needsSlugRedirect(raw: string): boolean {
  return canonicalSlug(raw) !== decodeSlugParam(raw);
}
