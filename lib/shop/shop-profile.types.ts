// Pure constants and shared shapes for the storefront profile. No DB
// imports — client components (admin card, cancel section) may import
// this module without dragging the Scylla client into the bundle.
export const SHOP_NAME_MAX = 100;
export const SHOP_HOTLINE_MAX = 24;
export const SHOP_ADDRESS_MAX = 300;

// Digits plus the separators people actually type for hotlines.
export const SHOP_HOTLINE_PATTERN = /^[0-9][0-9\s().+-]{3,23}$/;

export type ShopProfile = {
  displayName: string | null;
  hotline: string | null;
  address: string | null;
};

export type ShopProfileConfig = ShopProfile & {
  isDefault: boolean;
  updatedAt: string | null;
};

export const DEFAULT_SHOP_PROFILE: ShopProfile = {
  displayName: null,
  hotline: null,
  address: null,
};

export type ShopProfileErrors = Partial<
  Record<"displayName" | "hotline" | "address" | "form", string>
>;

export type ShopProfileResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: ShopProfileErrors };
