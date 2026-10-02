"use client";

// Right half of the campaign dialog: scope, issuance limits, the optional
// active window and the dispatcher grant cap.
import { fieldError } from "../services/catalog-errors";
import { SelectDropdown } from "../services/SelectDropdown";
import type { CampaignFieldsProps } from "./CampaignIdentityFields";
import {
  CAMPAIGN_INPUT,
  CAMPAIGN_LABEL,
  CampaignField,
} from "./campaign-fields";
import { SCOPE_OPTIONS } from "./voucher-format";

export function CampaignRuleFields({
  form,
  error,
  onSet,
}: CampaignFieldsProps) {
  return (
    <>
      <SelectDropdown
        label="Phạm vi áp dụng"
        value={form.scope}
        options={SCOPE_OPTIONS}
        onChange={(v) => onSet("scope", v)}
        listLabel="Chọn phạm vi áp dụng"
      />
      <CampaignField
        id="campaign-total-limit"
        label="Tổng lượt phát (0 = không giới hạn)"
        error={fieldError(error, "totalLimit")}
      >
        <input
          id="campaign-total-limit"
          value={form.totalLimit}
          inputMode="numeric"
          onChange={(e) => onSet("totalLimit", e.target.value)}
          className={CAMPAIGN_INPUT}
        />
      </CampaignField>
      <CampaignField
        id="campaign-per-user"
        label="Mỗi khách tối đa"
        error={fieldError(error, "perUserLimit")}
      >
        <input
          id="campaign-per-user"
          value={form.perUserLimit}
          inputMode="numeric"
          onChange={(e) => onSet("perUserLimit", e.target.value)}
          className={CAMPAIGN_INPUT}
        />
      </CampaignField>
      <CampaignField
        id="campaign-start"
        label="Bắt đầu"
        error={fieldError(error, "startAt")}
      >
        <input
          id="campaign-start"
          type="datetime-local"
          value={form.startAt}
          onChange={(e) => onSet("startAt", e.target.value)}
          className={CAMPAIGN_INPUT}
        />
      </CampaignField>
      <CampaignField
        id="campaign-end"
        label="Kết thúc"
        error={fieldError(error, "endAt")}
      >
        <input
          id="campaign-end"
          type="datetime-local"
          value={form.endAt}
          onChange={(e) => onSet("endAt", e.target.value)}
          className={CAMPAIGN_INPUT}
        />
      </CampaignField>
      <div className={`${CAMPAIGN_LABEL} sm:col-span-2`}>
        <label
          htmlFor="campaign-dispatcher-grant"
          className="flex items-center gap-2"
        >
          <input
            id="campaign-dispatcher-grant"
            type="checkbox"
            checked={form.allowDispatcherGrant}
            onChange={(e) => onSet("allowDispatcherGrant", e.target.checked)}
            className="h-4 w-4 accent-zinc-900 dark:accent-white"
          />
          Cho điều phối phát voucher của chiến dịch này
        </label>
        {form.allowDispatcherGrant && (
          <CampaignField
            id="campaign-dispatcher-cap"
            label="Hạn mức điều phối (đ, 0 = theo mệnh giá)"
            error={fieldError(error, "dispatcherMaxValue")}
          >
            <input
              id="campaign-dispatcher-cap"
              value={form.dispatcherMaxValue}
              inputMode="numeric"
              onChange={(e) => onSet("dispatcherMaxValue", e.target.value)}
              className={CAMPAIGN_INPUT}
            />
          </CampaignField>
        )}
      </div>
    </>
  );
}
