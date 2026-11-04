"use client";

// Right half of the campaign dialog: scope, issuance limits, the optional
// active window and the dispatcher grant cap.
import { useCallback } from "react";
import { DateTimeDropdown } from "@/components/ui/DateTimeDropdown";
import {
  quarterHourTimes,
  splitDateTime,
  withExtraTimes,
} from "@/components/ui/date-time-dropdown.utils";
import { fieldError } from "../services/catalog-errors";
import { SelectDropdown } from "../services/SelectDropdown";
import type { CampaignFieldsProps } from "./CampaignIdentityFields";
import {
  CAMPAIGN_INPUT,
  CAMPAIGN_LABEL,
  CampaignField,
} from "./campaign-fields";
import { SCOPE_OPTIONS } from "./voucher-format";

const ALL_DAY_TIMES = quarterHourTimes();

export function CampaignRuleFields({
  form,
  error,
  onSet,
}: CampaignFieldsProps) {
  // Times saved off the quarter-hour grid stay selectable.
  const startClock = splitDateTime(form.startAt).time;
  const endClock = splitDateTime(form.endAt).time;
  const startTimes = useCallback(
    () => withExtraTimes(ALL_DAY_TIMES, startClock),
    [startClock],
  );
  const endTimes = useCallback(
    () => withExtraTimes(ALL_DAY_TIMES, "23:59", endClock),
    [endClock],
  );
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
        id="campaign-redeem-code"
        label="Mã nhập tay (không bắt buộc)"
        error={fieldError(error, "redeemCode")}
      >
        <input
          id="campaign-redeem-code"
          value={form.redeemCode}
          onChange={(e) => onSet("redeemCode", e.target.value.toUpperCase())}
          placeholder="VD: GIAM50K"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={24}
          className={`${CAMPAIGN_INPUT} font-mono uppercase`}
        />
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Khách đã đăng nhập gõ mã này ở bước đặt lịch hoặc thanh toán để nhận
          voucher và dùng ngay. Để trống nếu chỉ phát tự động hoặc phát tay.
        </span>
      </CampaignField>
      <CampaignField
        id="campaign-start"
        label="Bắt đầu"
        error={fieldError(error, "startAt")}
      >
        <DateTimeDropdown
          id="campaign-start"
          value={form.startAt}
          timesFor={startTimes}
          defaultTime="00:00"
          clearable
          stacked
          placeholder="Không giới hạn"
          error={Boolean(fieldError(error, "startAt"))}
          onChange={(v) => onSet("startAt", v)}
        />
      </CampaignField>
      <CampaignField
        id="campaign-end"
        label="Kết thúc"
        error={fieldError(error, "endAt")}
      >
        <DateTimeDropdown
          id="campaign-end"
          value={form.endAt}
          timesFor={endTimes}
          defaultTime="23:59"
          clearable
          stacked
          placeholder="Không giới hạn"
          error={Boolean(fieldError(error, "endAt"))}
          onChange={(v) => onSet("endAt", v)}
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
            className="h-4 w-4 accent-[#FB923C] dark:accent-white"
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
