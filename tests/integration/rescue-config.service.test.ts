import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import {
  dispatchConfigRepoMocks,
  resetZoneAdminMocks,
  zoneAdminStubs,
} from "../helpers/zone.mocks";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports. Missing rows fall back to code defaults
// so fresh keyspaces behave like the hardcoded 30s flow.
mock.module(
  "@/lib/rescue/rescue-config.repository",
  () => dispatchConfigRepoMocks,
);

import {
  getDispatchConfig,
  updateDispatchConfig,
} from "@/lib/rescue/rescue-config.service";

function admin() {
  return makePublicUser({ role: "admin" });
}

beforeEach(() => {
  resetZoneAdminMocks();
});

describe("rescue dispatch config", () => {
  test("falls back to defaults when never saved", async () => {
    zoneAdminStubs.configRow = null;

    const config = await getDispatchConfig();

    expect(config).toMatchObject({
      offerTimeoutMs: 30_000,
      maxReoffers: 10,
      candidateLimit: 50,
      isDefault: true,
    });
  });

  test("reads saved values", async () => {
    zoneAdminStubs.configRow = {
      config_id: "default",
      offer_timeout_ms: 60_000,
      max_reoffers: 3,
      candidate_limit: 20,
      updated_at: new Date("2026-01-01T00:00:00Z"),
      updated_by: "admin-id",
    };

    const config = await getDispatchConfig();

    expect(config).toMatchObject({
      offerTimeoutMs: 60_000,
      maxReoffers: 3,
      candidateLimit: 20,
      isDefault: false,
    });
  });

  test("saves seconds-wire values as ms", async () => {
    const result = await updateDispatchConfig(admin(), {
      offerTimeoutSec: 45,
      maxReoffers: 5,
      candidateLimit: 30,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.config.offerTimeoutMs).toBe(45_000);
    expect(zoneAdminStubs.savedConfig).toMatchObject({
      offerTimeoutMs: 45_000,
      maxReoffers: 5,
      candidateLimit: 30,
      updatedBy: admin().id,
    });
  });

  test("rejects out-of-range values without writing", async () => {
    const bad = await updateDispatchConfig(admin(), {
      offerTimeoutSec: 5,
      maxReoffers: 99,
      candidateLimit: 100,
    });

    expect(bad.ok).toBe(false);
    if (bad.ok) return;
    expect(bad.errors.offerTimeoutMs).toContain("10 đến 300");
    expect(zoneAdminStubs.savedConfig).toBeNull();
  });

  test("forbids non-admins", async () => {
    const dispatcher = makePublicUser({ role: "dispatcher" });

    const result = await updateDispatchConfig(dispatcher, {
      offerTimeoutSec: 30,
      maxReoffers: 10,
      candidateLimit: 50,
    });

    expect(result.ok).toBe(false);
    expect(zoneAdminStubs.savedConfig).toBeNull();
  });
});
