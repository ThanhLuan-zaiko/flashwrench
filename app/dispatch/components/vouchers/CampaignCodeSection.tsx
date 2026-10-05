"use client";

// Dispatcher-facing "Mã nhập tay" editor: staff pick a campaign, then
// set, change or clear ONLY the code customers type at booking/checkout.
// Nothing else on the campaign is editable from this screen.
import { useState } from "react";
import { FiKey } from "react-icons/fi";
import { DropdownSelect } from "@/components/ui/DropdownSelect";
import {
  useDispatchCampaigns,
  useUpdateCampaignRedeemCode,
} from "@/hooks/useVouchers";
import { normalizeRedeemCode } from "@/lib/vouchers/voucher-validation";
import { AuthApiError } from "@/services/auth.api";

const INPUT =
  "min-h-[44px] w-full rounded-xl border border-zinc-200 bg-white px-3 font-mono text-sm uppercase text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50";
const PRIMARY_BUTTON =
  "flex min-h-[44px] items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white disabled:opacity-50 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900";
const GHOST_BUTTON =
  "flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 transition-colors duration-150 hover:bg-zinc-100 disabled:opacity-50 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";

function readError(error: unknown): string {
  if (error instanceof AuthApiError) {
    const errors = error.errors as Record<string, string | undefined>;
    return errors.redeemCode ?? errors.form ?? error.message;
  }
  return error instanceof Error ? error.message : "Không cập nhật được mã.";
}

export function CampaignCodeSection() {
  const campaigns = useDispatchCampaigns(true);
  const mutation = useUpdateCampaignRedeemCode();
  const [campaignId, setCampaignId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const items = campaigns.data ?? [];
  const selected = items.find((item) => item.id === campaignId) ?? null;
  const current = selected?.redeemCode ?? "";
  const dirty = selected !== null && normalizeRedeemCode(code) !== current;

  function pickCampaign(id: string) {
    setCampaignId(id);
    setCode(items.find((item) => item.id === id)?.redeemCode ?? "");
    setError("");
    setSuccess("");
  }

  async function save(rawCode: string) {
    if (!selected) return;
    setError("");
    setSuccess("");
    try {
      await mutation.mutateAsync({ id: selected.id, redeemCode: rawCode });
      setCode(normalizeRedeemCode(rawCode));
      setSuccess("Đã cập nhật mã.");
    } catch (err) {
      setError(readError(err));
    }
  }

  return (
    <section
      aria-label="Mã nhập tay"
      className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
        <FiKey aria-hidden="true" className="h-4 w-4" />
        Mã nhập tay
      </h2>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        Khách đã đăng nhập gõ mã này ở bước đặt lịch hoặc thanh toán để nhận
        voucher vào ví và dùng ngay. Điều phối chỉ đổi được mã, không sửa được
        nội dung chiến dịch.
      </p>
      <div className="mt-3 flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        <span id="code-campaign-label">Chiến dịch</span>
        <DropdownSelect
          id="code-campaign"
          labelId="code-campaign-label"
          value={campaignId}
          onChange={pickCampaign}
          placeholder="Chọn chiến dịch…"
          options={items.map((item) => ({
            value: item.id,
            label: item.name,
            hint: item.code,
          }))}
        />
      </div>
      {selected && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Mã hiện tại:{" "}
            {current ? (
              <span className="inline-block rounded-md border border-zinc-200 px-1.5 py-0.5 font-mono text-xs font-semibold text-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
                {current}
              </span>
            ) : (
              "Chưa có mã"
            )}
          </p>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Mã mới (4–20 chữ cái không dấu hoặc chữ số)
            <input
              value={code}
              onChange={(e) => setCode(normalizeRedeemCode(e.target.value))}
              placeholder="VD: GIAM50K"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              maxLength={24}
              className={INPUT}
            />
          </label>
          {error && (
            <p
              aria-live="polite"
              className="text-xs text-red-600 dark:text-red-400"
            >
              {error}
            </p>
          )}
          {success && (
            <p
              aria-live="polite"
              className="text-xs text-zinc-600 dark:text-zinc-300"
            >
              {success}
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => save(code)}
              disabled={mutation.isPending || !dirty}
              className={PRIMARY_BUTTON}
            >
              {mutation.isPending ? "Đang lưu…" : "Lưu mã"}
            </button>
            {current !== "" && (
              <button
                type="button"
                onClick={() => save("")}
                disabled={mutation.isPending}
                className={GHOST_BUTTON}
              >
                Gỡ mã
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
