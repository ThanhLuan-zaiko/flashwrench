import { describe, expect, test } from "bun:test";
import {
  classifyTraffic,
  declaredBodyTooLarge,
  isUploadPath,
} from "@/lib/security/traffic";

describe("classifyTraffic", () => {
  test("routes auth endpoints to the strictest class", () => {
    expect(classifyTraffic("/api/auth/login", "POST")).toBe("auth");
    expect(classifyTraffic("/api/auth/refresh", "POST")).toBe("auth");
  });

  test("separates media reads from other API traffic", () => {
    expect(classifyTraffic("/api/media/uploads/a.webp", "GET")).toBe("media");
    expect(classifyTraffic("/api/media/uploads/a.webp", "HEAD")).toBe("media");
    expect(classifyTraffic("/api/media", "POST")).toBe("api");
  });

  test("classifies remaining API calls as api and the rest as page", () => {
    expect(classifyTraffic("/api/bookings", "GET")).toBe("api");
    expect(classifyTraffic("/api/bookings", "POST")).toBe("api");
    expect(classifyTraffic("/", "GET")).toBe("page");
    expect(classifyTraffic("/services", "GET")).toBe("page");
  });

  test("backstops static file extensions outside the API namespace", () => {
    expect(classifyTraffic("/brand.png", "GET")).toBe("asset");
    expect(classifyTraffic("/robots.txt", "GET")).toBe("asset");
    // API paths stay dynamic even when the key looks like a file.
    expect(classifyTraffic("/api/media/x.png", "GET")).toBe("media");
  });
});

describe("declaredBodyTooLarge", () => {
  test("only rejects declared oversizes; missing headers pass", () => {
    expect(declaredBodyTooLarge(null, 100)).toBe(false);
    expect(declaredBodyTooLarge("50", 100)).toBe(false);
    expect(declaredBodyTooLarge("101", 100)).toBe(true);
    expect(declaredBodyTooLarge("not-a-number", 100)).toBe(false);
  });
});

describe("isUploadPath", () => {
  test("matches only POST uploads to the media route", () => {
    expect(isUploadPath("/api/media", "POST")).toBe(true);
    expect(isUploadPath("/api/media/x", "POST")).toBe(true);
    expect(isUploadPath("/api/media/x", "GET")).toBe(false);
    expect(isUploadPath("/api/bookings", "POST")).toBe(false);
  });
});
