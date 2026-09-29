// Speculation Rules API payloads shared by every page area. Chromium
// browsers prerender/prefetch the most likely next routes; every other
// browser ignores the unknown <script type="speculationrules"> block.

export type SpeculationEagerness =
  | "immediate"
  | "eager"
  | "moderate"
  | "conservative";

export type SpeculationDocumentRule = {
  where: { href_matches: string };
  eagerness: SpeculationEagerness;
};

export type SpeculationRuleSet = {
  prerender: SpeculationDocumentRule[];
  prefetch: SpeculationDocumentRule[];
};

// A URLPattern route (e.g. "/products*") or a pattern with an explicit
// eagerness override.
export type SpeculationRoute =
  | string
  | { match: string; eagerness: SpeculationEagerness };

// Prerender waits for a ~200ms hover ("moderate") because it runs the full
// document; prefetch defaults to pointer-down ("conservative"), cheap enough
// to apply broadly without wasting bandwidth.
const PRERENDER_DEFAULT: SpeculationEagerness = "moderate";
const PREFETCH_DEFAULT: SpeculationEagerness = "conservative";

function toDocumentRules(
  routes: readonly SpeculationRoute[],
  fallback: SpeculationEagerness,
): SpeculationDocumentRule[] {
  return routes.map((route) =>
    typeof route === "string"
      ? { where: { href_matches: route }, eagerness: fallback }
      : { where: { href_matches: route.match }, eagerness: route.eagerness },
  );
}

export function buildSpeculationRules(input: {
  prerender?: readonly SpeculationRoute[];
  prefetch?: readonly SpeculationRoute[];
}): SpeculationRuleSet {
  return {
    prerender: toDocumentRules(input.prerender ?? [], PRERENDER_DEFAULT),
    prefetch: toDocumentRules(input.prefetch ?? [], PREFETCH_DEFAULT),
  };
}

// "</script" can never appear inside route patterns, but escape "<" anyway
// so the JSON stays safe inside a script tag forever.
export function serializeSpeculationRules(rules: SpeculationRuleSet): string {
  return JSON.stringify(rules).replace(/</g, "\\u003c");
}
