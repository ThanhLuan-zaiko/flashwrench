import { describe, expect, test } from "bun:test";
import {
  avatarAssetIdForAction,
  decideAvatarAction,
  initialAvatarFromItem,
  isAvatarDirty,
} from "@/app/admin/components/users/staff-avatar";

describe("initialAvatarFromItem", () => {
  test("returns null for missing rows and blank urls", () => {
    expect(initialAvatarFromItem(null)).toBe(null);
    expect(initialAvatarFromItem({ avatarUrl: null })).toBe(null);
    expect(initialAvatarFromItem({ avatarUrl: "   " })).toBe(null);
  });

  test("trims the saved url", () => {
    expect(
      initialAvatarFromItem({ avatarUrl: "  /api/media/avatar/a.jpg  " }),
    ).toBe("/api/media/avatar/a.jpg");
  });
});

describe("isAvatarDirty", () => {
  test("spots staged picks, removals and kept photos", () => {
    expect(isAvatarDirty(null, null, false)).toBe(false);
    expect(isAvatarDirty("/a.jpg", "/a.jpg", false)).toBe(false);
    expect(isAvatarDirty("/a.jpg", "/a.jpg", true)).toBe(true);
    expect(isAvatarDirty("/a.jpg", null, false)).toBe(true);
    expect(isAvatarDirty(null, null, true)).toBe(true);
  });
});

describe("decideAvatarAction", () => {
  test("maps staged, cleared and kept states", () => {
    expect(decideAvatarAction("/a.jpg", "/a.jpg", true)).toBe("replace");
    expect(decideAvatarAction(null, null, true)).toBe("replace");
    expect(decideAvatarAction("/a.jpg", null, false)).toBe("clear");
    expect(decideAvatarAction("/a.jpg", "/a.jpg", false)).toBe("keep");
    expect(decideAvatarAction(null, null, false)).toBe("keep");
  });
});

describe("avatarAssetIdForAction", () => {
  test("maps actions to route payload values", () => {
    expect(avatarAssetIdForAction("replace", "asset-id")).toBe("asset-id");
    expect(avatarAssetIdForAction("replace", null)).toBe(undefined);
    expect(avatarAssetIdForAction("clear", "asset-id")).toBe(null);
    expect(avatarAssetIdForAction("keep", "asset-id")).toBe(undefined);
  });
});
