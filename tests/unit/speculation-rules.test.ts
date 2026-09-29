import { describe, expect, test } from "bun:test";
import {
  SPECULATION_SCOPES,
  speculationRulesForScope,
} from "@/lib/speculation/scopes";
import {
  buildSpeculationRules,
  serializeSpeculationRules,
} from "@/lib/speculation/speculation-rules";

const ALLOWED_EAGERNESS = new Set([
  "immediate",
  "eager",
  "moderate",
  "conservative",
]);

describe("buildSpeculationRules", () => {
  test("defaults prerender to moderate and prefetch to conservative", () => {
    const rules = buildSpeculationRules({
      prerender: ["/a*"],
      prefetch: ["/b*"],
    });
    expect(rules.prerender[0].eagerness).toBe("moderate");
    expect(rules.prefetch[0].eagerness).toBe("conservative");
  });

  test("honours per-route eagerness overrides", () => {
    const rules = buildSpeculationRules({
      prefetch: [{ match: "/x*", eagerness: "eager" }],
    });
    expect(rules.prefetch[0].eagerness).toBe("eager");
    expect(rules.prerender).toEqual([]);
  });
});

describe("speculationRulesForScope", () => {
  test("every declared scope emits at least one document rule", () => {
    for (const scope of SPECULATION_SCOPES) {
      const rules = speculationRulesForScope(scope);
      expect(rules.prerender.length + rules.prefetch.length).toBeGreaterThan(0);
    }
  });

  test("every rule matches an absolute path with a valid eagerness", () => {
    for (const scope of SPECULATION_SCOPES) {
      const rules = speculationRulesForScope(scope);
      for (const rule of [...rules.prerender, ...rules.prefetch]) {
        expect(rule.where.href_matches.startsWith("/")).toBe(true);
        expect(ALLOWED_EAGERNESS.has(rule.eagerness)).toBe(true);
      }
    }
  });

  test("no scope duplicates a pattern across prerender and prefetch", () => {
    for (const scope of SPECULATION_SCOPES) {
      const rules = speculationRulesForScope(scope);
      const prerendered = new Set(
        rules.prerender.map((rule) => rule.where.href_matches),
      );
      for (const rule of rules.prefetch) {
        expect(prerendered.has(rule.where.href_matches)).toBe(false);
      }
    }
  });

  test("home scope keeps the landing funnel: catalog prerender, auth prefetch", () => {
    const rules = speculationRulesForScope("home");
    expect(rules.prerender.map((rule) => rule.where.href_matches)).toEqual([
      "/services*",
      "/products*",
      "/rescue*",
    ]);
    expect(rules.prefetch.map((rule) => rule.where.href_matches)).toEqual([
      "/booking*",
      "/login*",
      "/register*",
    ]);
  });

  test("staff workspaces prefetch only — prerendering would poll for nothing", () => {
    for (const scope of ["mechanic", "dispatch", "admin"] as const) {
      expect(speculationRulesForScope(scope).prerender).toEqual([]);
    }
  });
});

describe("serializeSpeculationRules", () => {
  test("produces parseable JSON matching the rules object", () => {
    const rules = speculationRulesForScope("home");
    const parsed = JSON.parse(serializeSpeculationRules(rules));
    expect(parsed).toEqual(JSON.parse(JSON.stringify(rules)));
  });

  test("escapes angle brackets so the JSON stays safe in a script tag", () => {
    const serialized = serializeSpeculationRules({
      prerender: [
        { where: { href_matches: "/x</script>" }, eagerness: "moderate" },
      ],
      prefetch: [],
    });
    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c");
  });
});
