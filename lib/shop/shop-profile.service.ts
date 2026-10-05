// Storefront identity for admins: display name, hotline and address the
// customer touchpoints render (cancel note, contact links). The
// single-row shop_profile table is optional — a missing table or row
// falls back to empty defaults so a fresh keyspace keeps working.
import type { PublicUser } from "@/lib/auth/user.types";
import { isRecord } from "@/lib/validation";
import { findShopProfile, saveShopProfile } from "./shop-profile.repository";
import {
  DEFAULT_SHOP_PROFILE,
  SHOP_ADDRESS_MAX,
  SHOP_HOTLINE_MAX,
  SHOP_HOTLINE_PATTERN,
  SHOP_NAME_MAX,
  type ShopProfile,
  type ShopProfileConfig,
  type ShopProfileErrors,
  type ShopProfileResult,
} from "./shop-profile.types";

export type {
  ShopProfile,
  ShopProfileConfig,
  ShopProfileErrors,
  ShopProfileResult,
};
export {
  DEFAULT_SHOP_PROFILE,
  SHOP_ADDRESS_MAX,
  SHOP_HOTLINE_MAX,
  SHOP_HOTLINE_PATTERN,
  SHOP_NAME_MAX,
};

export function defaultShopProfileConfig(): ShopProfileConfig {
  return { ...DEFAULT_SHOP_PROFILE, isDefault: true, updatedAt: null };
}

// Public read for customer touchpoints: any failure degrades to empty
// defaults so a skipped migration never breaks a page.
export async function getShopProfile(): Promise<ShopProfile> {
  try {
    const row = await findShopProfile();
    if (!row) return DEFAULT_SHOP_PROFILE;
    return {
      displayName: row.display_name,
      hotline: row.hotline,
      address: row.address,
    };
  } catch {
    return DEFAULT_SHOP_PROFILE;
  }
}

// Admin read surfaces errors normally so the card can show a retry.
export async function getShopProfileConfig(): Promise<ShopProfileConfig> {
  const row = await findShopProfile();
  if (!row) return defaultShopProfileConfig();
  return {
    displayName: row.display_name,
    hotline: row.hotline,
    address: row.address,
    isDefault: false,
    updatedAt: row.updated_at?.toISOString() ?? null,
  };
}

function fail<T>(status: number, form: string): ShopProfileResult<T> {
  return { ok: false, status, errors: { form } };
}

function optionalText(
  value: unknown,
  max: number,
  message: string,
  errors: ShopProfileErrors,
  field: "displayName" | "hotline" | "address",
): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    errors[field] = message;
    return null;
  }
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  if (trimmed.length > max) {
    errors[field] = message;
    return null;
  }
  return trimmed;
}

export async function updateShopProfile(
  actor: PublicUser,
  raw: unknown,
): Promise<ShopProfileResult<{ profile: ShopProfileConfig }>> {
  if (actor.role !== "admin") {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  if (!isRecord(raw)) {
    return fail(400, "Dữ liệu gửi lên không hợp lệ.");
  }
  const errors: ShopProfileErrors = {};
  const displayName = optionalText(
    raw.displayName,
    SHOP_NAME_MAX,
    `Tên cửa hàng tối đa ${SHOP_NAME_MAX} ký tự.`,
    errors,
    "displayName",
  );
  const hotline = optionalText(
    raw.hotline,
    SHOP_HOTLINE_MAX,
    "Hotline tối đa 24 ký tự (số và dấu cách/ngoặc).",
    errors,
    "hotline",
  );
  if (hotline !== null && !SHOP_HOTLINE_PATTERN.test(hotline)) {
    errors.hotline = "Hotline không hợp lệ. Ví dụ: 1900 6368.";
  }
  const address = optionalText(
    raw.address,
    SHOP_ADDRESS_MAX,
    `Địa chỉ tối đa ${SHOP_ADDRESS_MAX} ký tự.`,
    errors,
    "address",
  );
  if (Object.keys(errors).length > 0) {
    return { ok: false, status: 400, errors };
  }
  const at = new Date();
  await saveShopProfile({
    displayName,
    hotline,
    address,
    updatedBy: actor.id,
    updatedAt: at,
  });
  return {
    ok: true,
    data: {
      profile: {
        displayName,
        hotline,
        address,
        isDefault: false,
        updatedAt: at.toISOString(),
      },
    },
  };
}
