"use client";

import { useState } from "react";
import { DropdownSelect } from "@/components/ui/DropdownSelect";
import { useCreateAutoRule, useDispatchCampaigns } from "@/hooks/useVouchers";
import type { AutoTrigger } from "@/lib/vouchers/auto-rule.types";
import {
  AUTO_TRIGGER_OPTIONS,
  thresholdInputLabel,
  windowDaysInputLabel,
} from "./auto-rule-format";

const inputClass =
  "min-h-[44px] rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white";
const labelClass =
  "flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300";

export function AutoRuleForm() {
  const create = useCreateAutoRule();
  // Dispatchers may only wire campaigns they are allowed to grant from —
  // the API enforces it too; the filter keeps the picker honest.
  const campaigns = useDispatchCampaigns(true);
  const [name, setName] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [triggerType, setTriggerType] = useState<AutoTrigger>("booking_count");
  const [threshold, setThreshold] = useState("5");
  const [windowDays, setWindowDays] = useState("30");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const grantable = (campaigns.data ?? []).filter(
    (campaign) => campaign.allowDispatcherGrant,
  );
  const thresholdLabel = thresholdInputLabel(triggerType);
  const windowDaysLabel = windowDaysInputLabel(triggerType);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const rule = await create.mutateAsync({
        name,
        campaignId,
        triggerType,
        threshold: thresholdLabel ? Number(threshold) : undefined,
        windowDays: windowDaysLabel ? Number(windowDays) : undefined,
        isActive: true,
      });
      setMessage(`Đã tạo quy tắc "${rule.name}".`);
      setName("");
      setCampaignId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được quy tắc.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
        Tạo quy tắc tự động
      </h2>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        Hệ thống tự phát voucher khi khách chạm điều kiện — không cần nhân viên
        thao tác.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className={labelClass}>
          Tên quy tắc
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Thưởng khách quen"
            className={inputClass}
          />
        </label>
        <div className={labelClass}>
          <span id="auto-rule-campaign-label">Chiến dịch</span>
          <DropdownSelect
            id="auto-rule-campaign"
            labelId="auto-rule-campaign-label"
            value={campaignId}
            onChange={setCampaignId}
            placeholder="Chọn chiến dịch…"
            options={grantable.map((item) => ({
              value: item.id,
              label: item.name,
              hint: item.code,
            }))}
          />
        </div>
        <div className={labelClass}>
          <span id="auto-rule-trigger-label">Khi nào phát</span>
          <DropdownSelect
            id="auto-rule-trigger"
            labelId="auto-rule-trigger-label"
            value={triggerType}
            onChange={(next) => setTriggerType(next as AutoTrigger)}
            options={AUTO_TRIGGER_OPTIONS}
          />
        </div>
        {thresholdLabel && (
          <label className={labelClass}>
            {thresholdLabel}
            <input
              value={threshold}
              inputMode="numeric"
              onChange={(e) => setThreshold(e.target.value)}
              className={inputClass}
            />
          </label>
        )}
        {windowDaysLabel && (
          <label className={labelClass}>
            {windowDaysLabel}
            <input
              value={windowDays}
              inputMode="numeric"
              onChange={(e) => setWindowDays(e.target.value)}
              className={inputClass}
            />
          </label>
        )}
      </div>
      {message && (
        <p
          aria-live="polite"
          className="mt-2 text-xs text-zinc-600 dark:text-zinc-300"
        >
          {message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-2 text-xs font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={create.isPending || !name.trim() || !campaignId}
        className="mt-3 flex min-h-[44px] items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white disabled:opacity-50 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900"
      >
        {create.isPending ? "Đang tạo…" : "Tạo quy tắc"}
      </button>
    </form>
  );
}
