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

  const BASE = "https://flashwrench.test";
  const matchesAnyRule = (scope: string, url: string): boolean => {
    const rules = speculationRulesForScope(
      scope as Parameters<typeof speculationRulesForScope>[0],
    );
    return [...rules.prerender, ...rules.prefetch].some((rule) =>
      new URLPattern({
        pathname: rule.where.href_matches,
        baseURL: BASE,
      }).test(url),
    );
  };

  test("every scope covers its own /page/N pager links", () => {
    const pagedUrls: Array<[string, string]> = [
      ["services", `${BASE}/services/page/2`],
      ["services", `${BASE}/services/thay-nhot/page/3`],
      ["products", `${BASE}/products/page/2`],
      ["dispatch", `${BASE}/dispatch/orders/dang-cho/page/4`],
      ["dispatch", `${BASE}/dispatch/stock/page/2`],
      ["admin", `${BASE}/admin/users/staff/page/5`],
      ["mechanic", `${BASE}/mechanic/income/all/page/2`],
      ["history", `${BASE}/history/page/2`],
    ];
    for (const [scope, url] of pagedUrls) {
      expect(matchesAnyRule(scope, url)).toBe(true);
    }
  });

  test("scopes hosting embedded pagers self-match their own path + query", () => {
    const embeddedUrls: Array<[string, string]> = [
      // Booking renders review widgets paging via ?srv_page= / ?mrv_<id>=.
      ["booking", `${BASE}/booking?srv_page=2`],
      ["booking", `${BASE}/booking?service=x&mrv_mech-1=3`],
      // /history comments live on the bare tab path — /history/* cannot
      // match it, so the scope must carry a self-match pattern.
      ["history", `${BASE}/history?cm_bk-1=2`],
      ["products", `${BASE}/products/loc-nhot?rv_page=2`],
      ["orders", `${BASE}/orders/ord-9?cm_ord-9=2`],
    ];
    for (const [scope, url] of embeddedUrls) {
      expect(matchesAnyRule(scope, url)).toBe(true);
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
