import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import {
  businessHoursRepoMocks,
  resetWorkspaceMocks,
  shopProfileRepoMocks,
  shopSettingsStubs,
} from "../helpers/workspace.mocks";

// Single-row shop settings: storefront identity plus the daily working
// window. Repositories are stubbed; services stay pure of Scylla here.
mock.module("@/lib/shop/shop-profile.repository", () => shopProfileRepoMocks);
mock.module(
  "@/lib/shop/business-hours.repository",
  () => businessHoursRepoMocks,
);

import {
  getBusinessHoursPolicy,
  updateBusinessHours,
} from "@/lib/shop/business-hours.service";
import {
  getShopProfile,
  updateShopProfile,
} from "@/lib/shop/shop-profile.service";

const ADMIN = makePublicUser({ role: "admin" });

beforeEach(() => resetWorkspaceMocks());

describe("shop profile", () => {
  test("falls back to empty defaults without a config row", async () => {
    shopSettingsStubs.profileRow = null;
    expect(await getShopProfile()).toEqual({
      displayName: null,
      hotline: null,
      address: null,
    });
  });

  test("validates hotline format and trims blank fields to null", async () => {
    const bad = await updateShopProfile(ADMIN, {
      displayName: "FlashWrench",
      hotline: "abc",
      address: "  ",
    });
    expect(bad).toMatchObject({ ok: false, status: 400 });
    if (bad.ok) return;
    expect(bad.errors.hotline).toBeTruthy();
    expect(shopProfileRepoMocks.saveShopProfile.mock.calls.length).toBe(0);

    const ok = await updateShopProfile(ADMIN, {
      displayName: "FlashWrench",
      hotline: "1900 6368",
      address: "12 Nguyễn Huệ, Quận 1",
    });
    expect(ok.ok).toBe(true);
    expect(
      shopProfileRepoMocks.saveShopProfile.mock.calls[0]?.[0],
    ).toMatchObject({
      displayName: "FlashWrench",
      hotline: "1900 6368",
      address: "12 Nguyễn Huệ, Quận 1",
    });
  });

  test("rejects non-admins", async () => {
    const result = await updateShopProfile(makePublicUser(), {});
    expect(result).toMatchObject({ ok: false, status: 403 });
  });
});

describe("business hours", () => {
  test("falls back to disabled without a config row", async () => {
    shopSettingsStubs.hoursRow = null;
    expect(await getBusinessHoursPolicy()).toMatchObject({
      enabled: false,
      opensAtMin: 420,
      closesAtMin: 1200,
      timeZone: "Asia/Ho_Chi_Minh",
    });
  });

  test("treats a stored zero-width window as disabled", async () => {
    shopSettingsStubs.hoursRow = {
      config_id: "default",
      enabled: true,
      opens_at_min: 1200,
      closes_at_min: 400,
      timezone: "Asia/Ho_Chi_Minh",
      updated_at: null,
      updated_by: null,
    };
    // The corrupt window must never reject every schedule — enforcement
    // flips off instead of locking intake.
    expect((await getBusinessHoursPolicy()).enabled).toBe(false);
  });

  test("requires close after open when saving", async () => {
    const result = await updateBusinessHours(ADMIN, {
      enabled: true,
      opensAtMin: 20 * 60,
      closesAtMin: 7 * 60,
      timeZone: "Asia/Ho_Chi_Minh",
    });
    expect(result).toMatchObject({ ok: false, status: 400 });
    if (result.ok) return;
    expect(result.errors.closesAtMin).toBeTruthy();
    expect(businessHoursRepoMocks.saveBusinessHours.mock.calls.length).toBe(0);
  });

  test("saves a tuned window and defaults a missing zone", async () => {
    const result = await updateBusinessHours(ADMIN, {
      enabled: true,
      opensAtMin: 7 * 60 + 30,
      closesAtMin: 21 * 60,
      timeZone: "garbage/zone",
    });
    expect(result.ok).toBe(true);
    expect(
      businessHoursRepoMocks.saveBusinessHours.mock.calls[0]?.[0],
    ).toMatchObject({
      enabled: true,
      opensAtMin: 450,
      closesAtMin: 1260,
      timeZone: "Asia/Ho_Chi_Minh",
    });
  });
});
