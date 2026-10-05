"use client";

// Left half of the campaign dialog: identity and value fields (slug,
// name, description, discount type/value, order minimum). The admin types
// a slug — the voucher code derives from it server-side and shows here as
// a read-only preview. Both stay immutable once the campaign exists.
import { slugifyName } from "@/lib/catalog/catalog-validation";
import { fieldError } from "../services/catalog-errors";
import { SelectDropdown } from "../services/SelectDropdown";
import { CAMPAIGN_INPUT, CampaignField } from "./campaign-fields";
import type { CampaignFormState } from "./campaign-form";
import { DISCOUNT_TYPE_OPTIONS } from "./voucher-format";

export type CampaignFieldsProps = {
  form: CampaignFormState;
  editing: boolean;
  error: unknown;
  onSet: <K extends keyof CampaignFormState>(
    key: K,
    value: CampaignFormState[K],
  ) => void;
};

type CampaignIdentityFieldsProps = CampaignFieldsProps & {
  slugTouched: boolean;
  codePreview: string;
  onSlugTouched: () => void;
};

export function CampaignIdentityFields({
  form,
  editing,
  error,
  slugTouched,
  codePreview,
  onSet,
  onSlugTouched,
}: CampaignIdentityFieldsProps) {
  return (
    <>
      <CampaignField
        id="campaign-name"
        label="Tên hiển thị"
        error={fieldError(error, "name")}
      >
        <input
          id="campaign-name"
          value={form.name}
          onChange={(e) => {
            onSet("name", e.target.value);
            if (!editing && !slugTouched) {
              onSet("slug", slugifyName(e.target.value));
            }
          }}
          placeholder="Chào mừng tài khoản mới"
          className={CAMPAIGN_INPUT}
        />
      </CampaignField>
      <CampaignField
        id="campaign-slug"
        label="Slug"
        error={fieldError(error, "slug")}
      >
        <span className="flex gap-2">
          <input
            id="campaign-slug"
            value={form.slug}
            disabled={editing}
            onChange={(e) => {
              onSet("slug", e.target.value);
              onSlugTouched();
            }}
            placeholder="chao-mung-tai-khoan-moi"
            className={`${CAMPAIGN_INPUT} font-mono`}
          />
          {!editing && (
            <button
              type="button"
              onClick={() => onSet("slug", slugifyName(form.name))}
              className="flex h-11 shrink-0 items-center rounded-xl border border-zinc-300 px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Tạo từ tên
            </button>
          )}
        </span>
        {codePreview && (
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Mã nội bộ:{" "}
            <span className="font-mono text-zinc-900 dark:text-zinc-100">
              {codePreview}
            </span>{" "}
            (khách không nhập mã này, hãy đặt Mã nhập tay)
          </span>
        )}
      </CampaignField>
      <CampaignField
        id="campaign-description"
        label="Mô tả"
        wide
        error={fieldError(error, "description")}
      >
        <textarea
          id="campaign-description"
          value={form.description}
          onChange={(e) => onSet("description", e.target.value)}
          rows={2}
          placeholder="Gửi tặng khách mới đăng ký…"
          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </CampaignField>
      <SelectDropdown
        label="Kiểu giảm giá"
        value={form.discountType}
        options={DISCOUNT_TYPE_OPTIONS}
        onChange={(v) => onSet("discountType", v)}
        listLabel="Chọn kiểu giảm giá"
      />
      <CampaignField
        id="campaign-value"
        label={
          form.discountType === "percent"
            ? "Phần trăm giảm (%)"
            : "Mệnh giá (đ)"
        }
        error={fieldError(error, "discountValue")}
      >
        <input
          id="campaign-value"
          value={form.discountValue}
          inputMode="numeric"
          disabled={form.discountType === "free_service"}
          onChange={(e) => onSet("discountValue", e.target.value)}
          className={CAMPAIGN_INPUT}
        />
      </CampaignField>
      {form.discountType === "percent" && (
        <CampaignField
          id="campaign-max-discount"
          label="Giảm tối đa (đ, 0 = không trần)"
          error={fieldError(error, "maxDiscount")}
        >
          <input
            id="campaign-max-discount"
            value={form.maxDiscount}
            inputMode="numeric"
            onChange={(e) => onSet("maxDiscount", e.target.value)}
            className={CAMPAIGN_INPUT}
          />
        </CampaignField>
      )}
      <CampaignField
        id="campaign-min-order"
        label="Đơn tối thiểu (đ)"
        error={fieldError(error, "minOrder")}
      >
        <input
          id="campaign-min-order"
          value={form.minOrder}
          inputMode="numeric"
          onChange={(e) => onSet("minOrder", e.target.value)}
          className={CAMPAIGN_INPUT}
        />
      </CampaignField>
    </>
  );
}
