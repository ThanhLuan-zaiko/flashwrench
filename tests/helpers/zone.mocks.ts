// Shared stubs for the admin zone and SLA suites. Tests mutate
// `zoneAdminStubs` and assert on `mock.calls`. Nothing touches ScyllaDB.
import { mock } from "bun:test";
import type {
  DispatchConfigRow,
  SaveDispatchConfigParams,
} from "@/lib/rescue/rescue-config.repository";
import type {
  ServiceZoneRow,
  UpsertServiceZoneParams,
} from "@/lib/zones/zone.repository";

export const zoneAdminStubs = {
  zones: [] as ServiceZoneRow[],
  zoneById: null as ServiceZoneRow | null,
  inserts: [] as UpsertServiceZoneParams[],
  updates: [] as UpsertServiceZoneParams[],
  configRow: null as DispatchConfigRow | null,
  savedConfig: null as SaveDispatchConfigParams | null,
};

export function makeZoneRow(
  overrides?: Partial<ServiceZoneRow>,
): ServiceZoneRow {
  return {
    zone_id: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",
    name: "Quan 1 - HCMC",
    city: "TP Ho Chi Minh",
    center_lat: 10.775,
    center_lng: 106.7,
    radius_km: 5,
    is_active: true,
    ...overrides,
  };
}

export const zoneRepoMocks = {
  listServiceZones: mock(
    async (): Promise<ServiceZoneRow[]> => zoneAdminStubs.zones,
  ),
  findServiceZoneById: mock(
    async (_zoneId: string): Promise<ServiceZoneRow | null> =>
      zoneAdminStubs.zoneById,
  ),
  insertServiceZone: mock(
    async (params: UpsertServiceZoneParams): Promise<void> => {
      zoneAdminStubs.inserts.push(params);
    },
  ),
  updateServiceZone: mock(
    async (params: UpsertServiceZoneParams): Promise<void> => {
      zoneAdminStubs.updates.push(params);
    },
  ),
};

export const dispatchConfigRepoMocks = {
  findDispatchConfig: mock(
    async (): Promise<DispatchConfigRow | null> => zoneAdminStubs.configRow,
  ),
  saveDispatchConfig: mock(
    async (params: SaveDispatchConfigParams): Promise<void> => {
      zoneAdminStubs.savedConfig = params;
    },
  ),
};

export function resetZoneAdminMocks(): void {
  zoneAdminStubs.zones = [];
  zoneAdminStubs.zoneById = null;
  zoneAdminStubs.inserts = [];
  zoneAdminStubs.updates = [];
  zoneAdminStubs.configRow = null;
  zoneAdminStubs.savedConfig = null;
  for (const fn of Object.values(zoneRepoMocks)) fn.mockClear();
  for (const fn of Object.values(dispatchConfigRepoMocks)) fn.mockClear();
}
