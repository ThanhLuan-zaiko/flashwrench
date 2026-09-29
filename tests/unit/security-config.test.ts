import { describe, expect, test } from "bun:test";
import {
  isShieldEnabled,
  overloadConfig,
  shieldRules,
} from "@/lib/security/security.constants";

describe("isShieldEnabled", () => {
  test("is on in production and off in development by default", () => {
    expect(isShieldEnabled({ NODE_ENV: "production" })).toBe(true);
    expect(isShieldEnabled({ NODE_ENV: "development" })).toBe(false);
    expect(isShieldEnabled({})).toBe(false);
  });

  test("honors the explicit flag in both directions", () => {
    expect(
      isShieldEnabled({ NODE_ENV: "development", SHIELD_ENABLED: "true" }),
    ).toBe(true);
    expect(
      isShieldEnabled({ NODE_ENV: "production", SHIELD_ENABLED: "false" }),
    ).toBe(false);
  });
});

describe("shieldRules", () => {
  test("ships safe defaults and a never-limiting asset class", () => {
    const rules = shieldRules({});
    expect(rules.auth.limit).toBeLessThan(rules.api.limit);
    expect(rules.api.limit).toBeLessThan(rules.media.limit);
    expect(rules.asset.limit).toBe(Number.MAX_SAFE_INTEGER);
  });

  test("reads overrides from the environment", () => {
    const rules = shieldRules({
      SHIELD_API_LIMIT: "7",
      SHIELD_WINDOW_MS: "500",
    });
    expect(rules.api).toEqual({ limit: 7, windowMs: 500 });
    expect(rules.page.windowMs).toBe(500);
  });

  test("ignores malformed values", () => {
    const rules = shieldRules({
      SHIELD_API_LIMIT: "abc",
      SHIELD_PAGE_LIMIT: "-3",
    });
    expect(rules.api.limit).toBe(120);
    expect(rules.page.limit).toBe(240);
  });
});

describe("overloadConfig", () => {
  test("derives the upload cap from MEDIA_MAX_MB when unset", () => {
    expect(overloadConfig({ MEDIA_MAX_MB: "4" }).maxUploadBytes).toBe(
      4 * 1_048_576,
    );
    expect(
      overloadConfig({ SHIELD_MAX_UPLOAD_BYTES: "2048" }).maxUploadBytes,
    ).toBe(2048);
  });
});
