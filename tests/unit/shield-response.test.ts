import { describe, expect, test } from "bun:test";
import { shieldRejection } from "@/lib/security/shield-response";

describe("shieldRejection", () => {
  test("answers API paths with the shared JSON error shape", async () => {
    const res = shieldRejection("/api/bookings", {
      action: "reject",
      status: 429,
      retryAfterSec: 7,
      reason: "rate_limited",
    });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("7");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const body = (await res.json()) as { errors: { form: string } };
    expect(body.errors.form).toContain("quá nhiều");
  });

  test("answers page paths with Vietnamese HTML", async () => {
    const res = shieldRejection("/services", {
      action: "reject",
      status: 503,
      retryAfterSec: 2,
      reason: "overloaded",
    });
    expect(res.status).toBe(503);
    expect(res.headers.get("content-type")).toContain("text/html");
    const html = await res.text();
    expect(html).toContain('lang="vi"');
    expect(html).toContain("quá tải");
    expect(html).toContain('http-equiv="refresh"');
  });

  test("omits Retry-After when there is nothing to wait for", () => {
    const res = shieldRejection("/api/media", {
      action: "reject",
      status: 413,
      retryAfterSec: 0,
      reason: "body_too_large",
    });
    expect(res.status).toBe(413);
    expect(res.headers.get("Retry-After")).toBeNull();
  });
});
