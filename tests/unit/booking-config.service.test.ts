import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import {
  bookingConfigRepoMocks,
  resetWorkspaceMocks,
  workspaceStubs,
} from "../helpers/workspace.mocks";

// Single-row booking intake policy: bounds, the max>min cross-check and
// the defaults a missing row degrades to. Repository is stubbed; the
// service stays pure of Scylla here.
mock.module(
  "@/lib/booking/booking-config.repository",
  () => bookingConfigRepoMocks,
);

import {
  getBookingPolicy,
  updateBookingConfig,
} from "@/lib/booking/booking-config.service";

const ADMIN = makePublicUser({ role: "admin" });
const PAYLOAD = {
  minLeadDays: 2,
  maxAdvanceDays: 30,
  cancelCutoffHours: 4,
  guestBookingEnabled: true,
};

beforeEach(() => resetWorkspaceMocks());

describe("getBookingPolicy", () => {
  test("falls back to the code defaults without a config row", async () => {
    workspaceStubs.bookingConfigRow = null;
    expect(await getBookingPolicy()).toEqual({
      minLeadDays: 2,
      maxAdvanceDays: 0,
      cancelCutoffHours: 0,
      guestBookingEnabled: true,
    });
  });

  test("reads the tuned row and tolerates legacy null columns", async () => {
    workspaceStubs.bookingConfigRow = {
      config_id: "default",
      min_lead_days: 4,
      max_advance_days: null,
      cancel_cutoff_hours: null,
      guest_booking_enabled: null,
      updated_at: null,
      updated_by: null,
    };
    expect(await getBookingPolicy()).toEqual({
      minLeadDays: 4,
      maxAdvanceDays: 0,
      cancelCutoffHours: 0,
      guestBookingEnabled: true,
    });
  });

  test("clamps a corrupted row back into bounds", async () => {
    workspaceStubs.bookingConfigRow = {
      config_id: "default",
      min_lead_days: 99,
      max_advance_days: 3,
      cancel_cutoff_hours: -5,
      guest_booking_enabled: false,
      updated_at: null,
      updated_by: null,
    };
    // Floor clamps to the max bound; a cap at/below it reads as no cap.
    // An explicit stored false still closes guest intake.
    expect(await getBookingPolicy()).toEqual({
      minLeadDays: 14,
      maxAdvanceDays: 0,
      cancelCutoffHours: 0,
      guestBookingEnabled: false,
    });
  });
});

describe("updateBookingConfig", () => {
  test("rejects non-admins and out-of-range values", async () => {
    const denied = await updateBookingConfig(makePublicUser(), PAYLOAD);
    expect(denied).toMatchObject({ ok: false, status: 403 });

    for (const bad of [
      { minLeadDays: -1 },
      { minLeadDays: 15 },
      { minLeadDays: 2.5 },
      { maxAdvanceDays: 366 },
      { maxAdvanceDays: -1 },
      { cancelCutoffHours: 169 },
      { cancelCutoffHours: -4 },
      { guestBookingEnabled: "yes" },
      { guestBookingEnabled: undefined },
    ]) {
      const result = await updateBookingConfig(ADMIN, { ...PAYLOAD, ...bad });
      expect(result).toMatchObject({ ok: false, status: 400 });
    }
    expect(bookingConfigRepoMocks.saveBookingConfig.mock.calls.length).toBe(0);
  });

  test("rejects an advance cap at or below the lead floor", async () => {
    for (const maxAdvanceDays of [1, 2]) {
      const result = await updateBookingConfig(ADMIN, {
        ...PAYLOAD,
        maxAdvanceDays,
      });
      expect(result).toMatchObject({ ok: false, status: 400 });
      if (result.ok) return;
      expect(result.errors.maxAdvanceDays).toContain("lớn hơn");
    }
    // 0 means "no cap" and stays valid against any floor.
    const open = await updateBookingConfig(ADMIN, {
      ...PAYLOAD,
      maxAdvanceDays: 0,
    });
    expect(open.ok).toBe(true);
  });

  test("saves all three knobs in one row", async () => {
    const result = await updateBookingConfig(ADMIN, PAYLOAD);
    expect(result.ok).toBe(true);
    const writes = bookingConfigRepoMocks.saveBookingConfig.mock.calls;
    expect(writes.length).toBe(1);
    expect(writes[0]?.[0]).toMatchObject({
      minLeadDays: 2,
      maxAdvanceDays: 30,
      cancelCutoffHours: 4,
      guestBookingEnabled: true,
    });
  });
});
