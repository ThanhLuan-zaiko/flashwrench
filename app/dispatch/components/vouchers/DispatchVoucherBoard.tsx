"use client";

import { useState } from "react";
import { useVoucherRealtime } from "@/hooks/useVoucherRealtime";
import { useDispatchCampaigns, useGrantWallet } from "@/hooks/useVouchers";

export function DispatchVoucherBoard() {
  useVoucherRealtime(undefined, true);
  const campaigns = useDispatchCampaigns(true);
  const grant = useGrantWallet();
  const [campaignId, setCampaignId] = useState("");
  const [userId, setUserId] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  async function handleGrant(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      const wallet = await grant.mutateAsync({ campaignId, userId, note });
      setMessage(`Đã phát voucher ${wallet.campaignCode} cho khách.`);
      setUserId("");
      setNote("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Không phát được.");
    }
  }

  const items = campaigns.data ?? [];
  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={handleGrant}
        className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
          Phát voucher đền bù / chào mừng
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Chỉ phát chiến dịch admin cho phép, vượt hạn mức sẽ bị chặn.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Chiến dịch
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="min-h-[44px] rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="">Chọn chiến dịch…</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.code})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            ID khách hàng
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="UUID tài khoản khách"
              className="min-h-[44px] rounded-xl border border-zinc-200 px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
        </div>
        <label className="mt-2 flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Ghi chú
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Lý do phát: đền bù trễ hẹn…"
            className="min-h-[44px] rounded-xl border border-zinc-200 px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          />
        </label>
        {message && (
          <p
            aria-live="polite"
            className="mt-2 text-xs text-zinc-600 dark:text-zinc-300"
          >
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={grant.isPending || !campaignId || !userId}
          className="mt-3 flex min-h-[44px] items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white disabled:opacity-50 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900"
        >
          {grant.isPending ? "Đang phát…" : "Phát voucher"}
        </button>
      </form>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Thu hồi voucher thực hiện ở bảng điều phối đơn khi phát hiện gian lận —
        điều phối chỉ thu hồi voucher mình đã phát, admin thu hồi mọi voucher.
      </p>
    </div>
  );
}
