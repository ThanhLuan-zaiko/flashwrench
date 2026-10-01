"use client";

import { useState } from "react";
import { useCreateCampaign } from "@/hooks/useVouchers";
import { uploadPromotionImage } from "@/services/vouchers.api";

export function CampaignCreateForm({ onCreated }: { onCreated: () => void }) {
  const create = useCreateCampaign();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [value, setValue] = useState("50000");
  const [imageUrl, setImageUrl] = useState("");
  const [assetId, setAssetId] = useState("");
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    try {
      const combined = await uploadPromotionImage(file);
      const [url, id] = combined.split("|");
      setImageUrl(url);
      setAssetId(id);
    } catch {
      setError("Không tải được ảnh bìa. Vui lòng thử lại.");
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await create.mutateAsync({
        code,
        name,
        description: "",
        imageUrl,
        imageAssetId: assetId || undefined,
        discountType: "fixed",
        discountValue: Number(value),
        maxDiscount: 0,
        minOrder: 0,
        scope: "all",
        totalLimit: 100,
        perUserLimit: 1,
        allowDispatcherGrant: true,
        dispatcherMaxValue: Number(value),
        isActive: true,
      });
      setCode("");
      setName("");
      setValue("50000");
      setImageUrl("");
      setAssetId("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
        Tạo chiến dịch mới
      </h2>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        Admin tạo, điều phối chỉ phát trong hạn mức.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Mã chiến dịch
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="VIDU_CHAOMUNG"
            className="min-h-[44px] rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Tên hiển thị
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Chào mừng tài khoản mới"
            className="min-h-[44px] rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Mệnh giá (đ)
          <input
            value={value}
            inputMode="numeric"
            onChange={(e) => setValue(e.target.value)}
            className="min-h-[44px] rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Ảnh bìa
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
            className="min-h-[44px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          />
        </label>
      </div>
      {imageUrl && (
        <p className="mt-2 truncate text-xs text-zinc-500 dark:text-zinc-400">
          Đã tải: {imageUrl}
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
        disabled={create.isPending}
        className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition-transform duration-200 disabled:opacity-50 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 sm:w-auto"
      >
        {create.isPending ? "Đang tạo…" : "Tạo chiến dịch"}
      </button>
    </form>
  );
}
