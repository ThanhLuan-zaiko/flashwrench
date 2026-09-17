import { describe, expect, test } from "bun:test";
import type { ServiceItemDraft } from "@/app/admin/components/services/service-item-dirty";
import { isServiceItemDirty } from "@/app/admin/components/services/service-item-dirty";
import { toServiceItem } from "@/lib/catalog/services.mapper";
import { makeServiceRow } from "../helpers/catalog.fixtures";

function draft(overrides?: Partial<ServiceItemDraft>): ServiceItemDraft {
  return {
    categoryId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    name: "Thay dau dong co",
    slug: "thay-dau-dong-co",
    description: "Gom cong thay.",
    basePrice: "199000",
    priceUnit: "per_job",
    durationMin: "60",
    isHomeSupported: true,
    isEmergencySupported: false,
    ...overrides,
  };
}

const CLEAN = {
  editing: toServiceItem(makeServiceRow()),
  preset: "",
  liveFirstId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  draft: draft(),
  existing: [] as string[],
  stagedCount: 0,
  pending: false,
};

describe("isServiceItemDirty", () => {
  test("pristine create and edit forms are clean", () => {
    expect(isServiceItemDirty(CLEAN)).toBe(false);
    expect(
      isServiceItemDirty({
        ...CLEAN,
        editing: null,
        draft: draft({
          categoryId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          name: "",
          slug: "",
          description: "",
        }),
      }),
    ).toBe(false);
  });

  test("typed fields, toggles and pricing mark dirty", () => {
    expect(
      isServiceItemDirty({ ...CLEAN, draft: draft({ name: "Thay lop" }) }),
    ).toBe(true);
    expect(
      isServiceItemDirty({ ...CLEAN, draft: draft({ basePrice: "200000" }) }),
    ).toBe(true);
    expect(
      isServiceItemDirty({
        ...CLEAN,
        draft: draft({ isEmergencySupported: true }),
      }),
    ).toBe(true);
  });

  test("gallery picks and in-flight saves mark dirty", () => {
    expect(isServiceItemDirty({ ...CLEAN, stagedCount: 2 })).toBe(true);
    expect(
      isServiceItemDirty({ ...CLEAN, existing: ["/api/media/x.jpg"] }),
    ).toBe(true);
    expect(isServiceItemDirty({ ...CLEAN, pending: true })).toBe(true);
  });
});
