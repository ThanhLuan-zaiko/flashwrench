"use client";

import { useEffect, useState } from "react";
import { FiSave } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import {
  useAdminShopProfile,
  useShopProfileMutation,
} from "@/hooks/shop-settings";
import {
  SHOP_ADDRESS_MAX,
  SHOP_HOTLINE_MAX,
  SHOP_NAME_MAX,
} from "@/lib/shop/shop-profile.types";
import { ShopSettingsApiError } from "@/services/shop-settings.api";

const INPUT_CLASSES =
  "min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

// Storefront identity shown to customers: the hotline renders as a tap
// target in the cancel note, the name/address are contact context.
// Empty fields mean "not set" — touchpoints hide them instead of
// inventing values.
export function ShopProfileCard() {
  const toast = useToast();
  const config = useAdminShopProfile();
  const save = useShopProfileMutation();
  const [displayName, setDisplayName] = useState("");
  const [hotline, setHotline] = useState("");
  const [address, setAddress] = useState("");
  const [loaded, setLoaded] = useState(false);

  const current = config.data?.profile;
  useEffect(() => {
    if (current && !loaded) {
      setDisplayName(current.displayName ?? "");
      setHotline(current.hotline ?? "");
      setAddress(current.address ?? "");
      setLoaded(true);
    }
  }, [current, loaded]);

  function handleSave() {
    save.mutate(
      {
        displayName: displayName.trim() || null,
        hotline: hotline.trim() || null,
        address: address.trim() || null,
      },
      {
        onSuccess: () =>
          toast.success(
            "Đã lưu thông tin cửa hàng",
            "Áp dụng ngay cho các trang khách hàng.",
          ),
        onError: (error) => {
          const message =
            error instanceof ShopSettingsApiError
              ? (error.errors.displayName ??
                error.errors.hotline ??
                error.errors.address ??
                error.errors.form ??
                "Vui lòng kiểm tra lại.")
              : "Vui lòng thử lại sau.";
          toast.error("Không lưu được", message);
        },
      },
    );
  }

  const busy = config.isPending || save.isPending;

  return (
    <section
      aria-label="Thông tin cửa hàng"
      data-reveal
      className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Thông tin cửa hàng
      </h2>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        {current?.isDefault === false
          ? "Đã tùy chỉnh — hotline hiển thị ở trang hủy lịch và liên hệ."
          : "Chưa cấu hình — các trang khách hàng đang dùng mặc định."}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Tên cửa hàng
          <input
            type="text"
            maxLength={SHOP_NAME_MAX}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={busy}
            placeholder="FlashWrench"
            className={INPUT_CLASSES}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Hotline
          <input
            type="tel"
            maxLength={SHOP_HOTLINE_MAX}
            value={hotline}
            onChange={(e) => setHotline(e.target.value)}
            disabled={busy}
            placeholder="1900 6368"
            className={INPUT_CLASSES}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 sm:col-span-2">
          Địa chỉ
          <input
            type="text"
            maxLength={SHOP_ADDRESS_MAX}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={busy}
            placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
            className={INPUT_CLASSES}
          />
        </label>
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={save.isPending}
        className="mt-3 flex min-h-[44px] items-center gap-1.5 rounded-xl bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        <FiSave aria-hidden="true" className="h-4 w-4" />
        {save.isPending ? "Đang lưu…" : "Lưu thông tin"}
      </button>
    </section>
  );
}
