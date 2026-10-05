import { mock } from "bun:test";
import type {
  BusinessHoursRow,
  SaveBusinessHoursParams,
} from "@/lib/shop/business-hours.repository";
import type {
  SaveShopProfileParams,
  ShopProfileRow,
} from "@/lib/shop/shop-profile.repository";

// Repo stubs for the single-row shop settings tables. Kept in a sibling
// file because workspace.mocks.ts sits at the 350-line cap.
export const shopSettingsStubs = {
  profileRow: null as ShopProfileRow | null,
  hoursRow: null as BusinessHoursRow | null,
};

export const shopProfileRepoMocks = {
  findShopProfile: mock(
    async (): Promise<ShopProfileRow | null> => shopSettingsStubs.profileRow,
  ),
  saveShopProfile: mock(
    async (_params: SaveShopProfileParams): Promise<void> => undefined,
  ),
};

export const businessHoursRepoMocks = {
  findBusinessHours: mock(
    async (): Promise<BusinessHoursRow | null> => shopSettingsStubs.hoursRow,
  ),
  saveBusinessHours: mock(
    async (_params: SaveBusinessHoursParams): Promise<void> => undefined,
  ),
};

export function resetShopSettingsMocks(): void {
  shopSettingsStubs.profileRow = null;
  shopSettingsStubs.hoursRow = null;
  for (const fn of Object.values(shopProfileRepoMocks)) fn.mockClear();
  for (const fn of Object.values(businessHoursRepoMocks)) fn.mockClear();
}
