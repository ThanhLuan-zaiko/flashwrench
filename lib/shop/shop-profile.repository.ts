// Raw CQL for the storefront profile. Single row (config_id='default');
// missing rows fall back to code defaults in the service.
import { scylla } from "@/lib/db/client";

export type ShopProfileRow = {
  config_id: string;
  display_name: string | null;
  hotline: string | null;
  address: string | null;
  updated_at: Date | null;
  updated_by: string | null;
};

export const SHOP_PROFILE_ID = "default";

function toTextOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

export async function findShopProfile(): Promise<ShopProfileRow | null> {
  const result = await scylla.execute(
    "SELECT config_id, display_name, hotline, address, updated_at, updated_by FROM shop_profile WHERE config_id = ?",
    [SHOP_PROFILE_ID],
    { prepare: true },
  );
  const raw = result.first() as unknown as Record<string, unknown> | null;
  if (!raw) return null;
  const updatedAt = raw.updated_at;
  return {
    config_id: String(raw.config_id),
    display_name: toTextOrNull(raw.display_name),
    hotline: toTextOrNull(raw.hotline),
    address: toTextOrNull(raw.address),
    updated_at:
      updatedAt instanceof Date && !Number.isNaN(updatedAt.getTime())
        ? updatedAt
        : null,
    updated_by:
      raw.updated_by === null || raw.updated_by === undefined
        ? null
        : String(raw.updated_by),
  };
}

export type SaveShopProfileParams = {
  displayName: string | null;
  hotline: string | null;
  address: string | null;
  updatedBy: string;
  updatedAt: Date;
};

export async function saveShopProfile(
  params: SaveShopProfileParams,
): Promise<void> {
  await scylla.execute(
    "INSERT INTO shop_profile (config_id, display_name, hotline, address, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?)",
    [
      SHOP_PROFILE_ID,
      params.displayName,
      params.hotline,
      params.address,
      params.updatedAt,
      params.updatedBy,
    ],
    { prepare: true },
  );
}
