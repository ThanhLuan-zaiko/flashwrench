import { describe, expect, test } from "bun:test";
import { clientIp, isTrustedOrigin, rateLimitBucket } from "@/lib/auth/guards";

function guardedRequest(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/auth/login", { headers });
}

describe("isTrustedOrigin", () => {
  test("allows non-browser clients without Origin", () => {
    expect(isTrustedOrigin(guardedRequest({}))).toBe(true);
  });

  test("allows same-origin browser requests", () => {
    expect(
      isTrustedOrigin(
        guardedRequest({
          origin: "http://localhost:3000",
          host: "localhost:3000",
        }),
      ),
    ).toBe(true);
  });

  test("blocks cross-origin requests", () => {
    expect(
      isTrustedOrigin(
        guardedRequest({ origin: "https://evil.test", host: "localhost:3000" }),
      ),
    ).toBe(false);
  });

  test("blocks unparsable origins", () => {
    expect(
      isTrustedOrigin(guardedRequest({ origin: "://bad", host: "localhost" })),
    ).toBe(false);
  });
});

describe("clientIp", () => {
  test("prefers the first forwarded address", () => {
    expect(
      clientIp(guardedRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" })),
    ).toBe("1.2.3.4");
  });

  test("falls back to x-real-ip then unknown", () => {
    expect(clientIp(guardedRequest({ "x-real-ip": "9.9.9.9" }))).toBe(
      "9.9.9.9",
    );
    expect(clientIp(guardedRequest({}))).toBe("unknown");
  });
});

describe("rateLimitBucket", () => {
  test("shares one bucket inside a window and rotates after it", () => {
    const windowMs = 60_000;
    const first = rateLimitBucket("login", "1.2.3.4", windowMs);
    expect(first.startsWith("login:1.2.3.4:")).toBe(true);
    expect(rateLimitBucket("login", "1.2.3.4", windowMs)).toBe(first);
    expect(rateLimitBucket("register", "1.2.3.4", windowMs)).not.toBe(first);
  });
});
