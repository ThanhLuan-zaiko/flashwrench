import { describe, expect, test } from "bun:test";
import { monthBucket, toPublicUser } from "@/lib/auth/user.types";
import { deviceLabel } from "@/lib/auth/user-sessions";
import { makeUserRow } from "../helpers/auth.fixtures";

describe("deviceLabel", () => {
  test("falls back for missing or blank agents", () => {
    expect(deviceLabel(null)).toBeDefined();
    expect(deviceLabel("   ")).toBe(deviceLabel(null));
  });

  test("trims and caps agent length at 120 chars", () => {
    const label = deviceLabel(`  ${"a".repeat(200)}  `);
    expect(label.length).toBe(120);
  });
});

describe("toPublicUser", () => {
  test("maps rows and defaults missing role and status", () => {
    const user = toPublicUser(
      makeUserRow({ role: null, status: null, avatar_url: "http://img/x.png" }),
    );
    expect(user).toMatchObject({
      id: "11111111-1111-4111-8111-111111111111",
      fullName: "Nguyen Van An",
      phone: "0912345678",
      email: "an@example.com",
      role: "customer",
      status: "active",
      avatarUrl: "http://img/x.png",
    });
  });

  test("exposes null createdAt when the row has none", () => {
    expect(
      toPublicUser(makeUserRow({ created_at: null })).createdAt,
    ).toBeNull();
  });
});

describe("monthBucket", () => {
  test("formats UTC year-month buckets", () => {
    expect(monthBucket(new Date("2026-09-14T00:00:00.000Z"))).toBe("2026-09");
  });
});
