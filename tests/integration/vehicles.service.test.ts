import { beforeEach, describe, expect, mock, test } from "bun:test";
import { encodeCursor } from "@/lib/db/cursor";
import { makePublicUser } from "../helpers/auth.fixtures";
import { CUSTOMER_ID } from "../helpers/mechanic.fixtures";
import {
  makeMaintenanceRow,
  makeVehicleRow,
  resetWorkspaceMocks,
  VEHICLE_ID,
  vehicleRepoMocks,
  workspaceStubs,
} from "../helpers/workspace.mocks";

mock.module("@/lib/vehicles/vehicle.repository", () => vehicleRepoMocks);

import {
  createVehicle,
  getVehicle,
  listVehicleHistory,
  listVehicles,
  setVehicleArchived,
  updateVehicleDetails,
} from "@/lib/vehicles/vehicle.service";

const owner = makePublicUser({ id: CUSTOMER_ID, role: "customer" });
const OTHER_ID = "99999999-9999-4999-8999-999999999999";

function vehicleBody(overrides?: Record<string, unknown>) {
  return {
    licensePlate: "51A-123.45",
    brand: "Toyota",
    model: "Vios",
    year: 2019,
    vehicleType: "car",
    odometerKm: 45000,
    ...overrides,
  };
}

beforeEach(() => {
  resetWorkspaceMocks();
});

describe("listVehicles", () => {
  test("keeps only rows canonically owned by the caller", async () => {
    workspaceStubs.vehicleIdsByOwner = {
      vehicleIds: [VEHICLE_ID, OTHER_ID],
      pageState: "next",
    };
    workspaceStubs.vehicleRowsById.set(VEHICLE_ID, makeVehicleRow());
    workspaceStubs.vehicleRowsById.set(
      OTHER_ID,
      makeVehicleRow({ vehicle_id: OTHER_ID, owner_id: OTHER_ID }),
    );

    const result = await listVehicles(CUSTOMER_ID, {});
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(1);
    expect(result.data.items[0]?.id).toBe(VEHICLE_ID);
    expect(result.data.nextCursor).not.toBeNull();
  });

  test("drops stale foreign refs and rejects foreign cursors", async () => {
    workspaceStubs.vehicleIdsByOwner = {
      vehicleIds: [OTHER_ID],
      pageState: null,
    };
    const result = await listVehicles(CUSTOMER_ID, {});
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(0);

    const foreign = encodeCursor("state", `vehicles:${OTHER_ID}`);
    const denied = await listVehicles(CUSTOMER_ID, { cursor: foreign });
    expect(denied).toMatchObject({ ok: false, status: 400 });
  });
});

describe("getVehicle and detail writes", () => {
  test("rejects foreign access and unknown ids", async () => {
    workspaceStubs.vehicleById = makeVehicleRow({ owner_id: OTHER_ID });
    expect(await getVehicle(CUSTOMER_ID, VEHICLE_ID)).toMatchObject({
      ok: false,
      status: 404,
    });
    workspaceStubs.vehicleById = null;
    expect(await getVehicle(CUSTOMER_ID, VEHICLE_ID)).toMatchObject({
      ok: false,
      status: 404,
    });
    expect(await getVehicle(CUSTOMER_ID, "not-a-uuid")).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  test("rejects invalid input types without reading storage", async () => {
    for (const body of [null, [], "x", true]) {
      const result = await updateVehicleDetails(CUSTOMER_ID, VEHICLE_ID, body);
      expect(result).toMatchObject({ ok: false, status: 400 });
    }
    expect(vehicleRepoMocks.findVehicleRowById.mock.calls.length).toBe(0);
  });

  test("update keeps the immutable plate under canonical comparison", async () => {
    workspaceStubs.vehicleById = makeVehicleRow({ license_plate: "51A12345" });
    const same = await updateVehicleDetails(
      CUSTOMER_ID,
      VEHICLE_ID,
      vehicleBody({ licensePlate: "51A-123.45", odometerKm: 46000 }),
    );
    expect(same.ok).toBe(true);
    expect(vehicleRepoMocks.updateVehicle.mock.calls[0]?.[0]).toMatchObject({
      odometerKm: 46000,
    });

    const changed = await updateVehicleDetails(
      CUSTOMER_ID,
      VEHICLE_ID,
      vehicleBody({ licensePlate: "30A99999" }),
    );
    expect(changed).toMatchObject({ ok: false, status: 400 });
  });
});

describe("createVehicle plate claims", () => {
  test("claims the canonical plate so formats collide on one key", async () => {
    const result = await createVehicle(owner, vehicleBody());
    expect(result.ok).toBe(true);
    expect(vehicleRepoMocks.claimVehiclePlate.mock.calls[0]?.[0]).toBe(
      "51A12345",
    );

    workspaceStubs.plateClaimed = false;
    const dup = await createVehicle(owner, vehicleBody());
    expect(dup).toMatchObject({ ok: false, status: 409 });
    expect(workspaceStubs.insertedVehicles).toHaveLength(1);
  });

  test("releases the claim only when the ambiguous write provably missed", async () => {
    workspaceStubs.vehicleWriteFails = true;
    await expect(createVehicle(owner, vehicleBody())).rejects.toThrow(
      "timeout",
    );
    expect(workspaceStubs.releasedPlates).toEqual(["51A12345"]);

    resetWorkspaceMocks();
    workspaceStubs.vehicleWriteFails = true;
    workspaceStubs.vehicleById = makeVehicleRow();
    const retried = await createVehicle(owner, vehicleBody());
    expect(retried.ok).toBe(true);
    expect(workspaceStubs.releasedPlates).toEqual([]);
  });
});

describe("archive, restore and history", () => {
  test("archive flips the flag and restore reverses it", async () => {
    workspaceStubs.vehicleById = makeVehicleRow();
    const archived = await setVehicleArchived(CUSTOMER_ID, VEHICLE_ID, true);
    expect(archived.ok).toBe(true);
    if (archived.ok) expect(archived.data.archived).toBe(true);
    expect(vehicleRepoMocks.updateVehicle.mock.calls[0]?.[0]).toMatchObject({
      archived: true,
    });

    workspaceStubs.vehicleById = makeVehicleRow({ is_archived: true });
    const restored = await setVehicleArchived(CUSTOMER_ID, VEHICLE_ID, false);
    expect(restored.ok).toBe(true);
    if (restored.ok) expect(restored.data.archived).toBe(false);
    expect(vehicleRepoMocks.updateVehicle.mock.calls[1]?.[0]).toMatchObject({
      archived: false,
    });
  });

  test("foreign vehicles cannot be archived", async () => {
    workspaceStubs.vehicleById = makeVehicleRow({ owner_id: OTHER_ID });
    const result = await setVehicleArchived(CUSTOMER_ID, VEHICLE_ID, true);
    expect(result).toMatchObject({ ok: false, status: 404 });
    expect(vehicleRepoMocks.updateVehicle.mock.calls.length).toBe(0);
  });

  test("history stays readable on an archived vehicle", async () => {
    workspaceStubs.vehicleById = makeVehicleRow({ is_archived: true });
    workspaceStubs.maintenancePage = {
      rows: [makeMaintenanceRow()],
      pageState: "next",
    };
    const result = await listVehicleHistory(CUSTOMER_ID, VEHICLE_ID, {});
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(1);
    expect(result.data.nextCursor).not.toBeNull();
  });

  test("history rejects foreign owners before reading", async () => {
    workspaceStubs.vehicleById = makeVehicleRow({ owner_id: OTHER_ID });
    const result = await listVehicleHistory(CUSTOMER_ID, VEHICLE_ID, {});
    expect(result).toMatchObject({ ok: false, status: 404 });
    expect(
      vehicleRepoMocks.listMaintenanceRowsByVehicle.mock.calls.length,
    ).toBe(0);
  });
});
