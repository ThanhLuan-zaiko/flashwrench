"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { FormAlert } from "@/components/auth/FormAlert";
import { PrimaryOfferTicket } from "./PrimaryOfferTicket";
import { useWalletOffers } from "./useWalletOffers";
import { VoucherTotals } from "./VoucherTotals";
import { WalletOfferSections } from "./WalletOfferSections";

type WalletPickerProps = {
  kind: "order" | "booking";
  subtotal: number;
  value: string | null;
  error?: string;
  disabled?: boolean;
  showTotals?: boolean;
  // Always rendered (loading, error, empty, list): the typed-code field
  // — customers can enter a code no matter what offers exist.
  codeSlot?: ReactNode;
  onChange: (walletId: string | null) => void;
};

// The collapsible offer panel on booking/checkout: one primary ticket
// (best usable wallet — auto-applied — or the next best thing), a typed
// code field, and the rest behind a disclosure so the sticky aside never
// grows past the viewport.
export function WalletPicker({
  kind,
  subtotal,
  value,
  error,
  disabled,
  showTotals = false,
  codeSlot,
  onChange,
}: WalletPickerProps) {
  const labelId = useId();
  const sectionsId = `${labelId}-sections`;
  const [expanded, setExpanded] = useState(false);
  const {
    wallets,
    usable,
    near,
    codes,
    primary,
    selectedUsable,
    selectedDiscount,
    autoApplied,
    select,
    remove,
  } = useWalletOffers({ kind, subtotal, value, disabled, onChange });

  const heading =
    kind === "booking" ? "Ưu đãi cho lịch hẹn này" : "Ưu đãi cho đơn hàng này";
  const message =
    error ??
    (value && !selectedUsable
      ? "Voucher đã chọn không còn phù hợp. Vui lòng chọn lại."
      : undefined);
  const totals = showTotals ? (
    <VoucherTotals subtotal={subtotal} discount={selectedDiscount} />
  ) : null;

  if (wallets.isPending) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-zinc-500 motion-safe:animate-pulse dark:text-zinc-400">
          Đang tải voucher…
        </p>
        {codeSlot}
        {totals}
      </div>
    );
  }

  const restUsable =
    primary?.type === "wallet"
      ? usable.filter((entry) => entry.wallet.id !== primary.entry.wallet.id)
      : usable;
  const restNear =
    primary?.type === "near-wallet"
      ? near.filter((entry) => entry.wallet.id !== primary.entry.wallet.id)
      : near;
  const restCodes =
    primary?.type === "code" || primary?.type === "near-code"
      ? codes.filter(
          (entry) =>
            entry.campaign.campaignId !== primary.entry.campaign.campaignId,
        )
      : codes;
  const restCount = restUsable.length + restNear.length + restCodes.length;

  const emptyCopy = (
    <p className="text-xs text-zinc-500 dark:text-zinc-400">
      Chưa có voucher nào dùng được cho đơn này.{" "}
      <a
        href="/vouchers"
        className="inline-flex min-h-[44px] items-center rounded-lg font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
      >
        Xem ví voucher
      </a>
    </p>
  );

  if (wallets.isError || primary === null) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {heading}
        </span>
        {emptyCopy}
        {codeSlot}
        {message && <FormAlert message={message} />}
        {totals}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {heading}
      </span>
      <PrimaryOfferTicket
        primary={primary}
        kind={kind}
        subtotal={subtotal}
        bestWalletId={usable[0]?.wallet.id}
        autoApplied={autoApplied}
        disabled={disabled}
        onSelect={select}
        onRemove={remove}
        onClaimed={(wallet) => select(wallet.id)}
      />
      {restCount > 0 && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={expanded ? sectionsId : undefined}
          onClick={() => setExpanded((open) => !open)}
          className="flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-zinc-600 transition-colors duration-200 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <FiChevronDown
            aria-hidden="true"
            className={`h-4 w-4 motion-safe:transition-transform motion-safe:duration-200 ${expanded ? "rotate-180" : ""}`}
          />
          {expanded ? "Thu gọn ưu đãi" : `Xem thêm ưu đãi (${restCount})`}
        </button>
      )}
      {expanded && restCount > 0 && (
        <div id={sectionsId}>
          <WalletOfferSections
            kind={kind}
            subtotal={subtotal}
            usable={restUsable}
            near={restNear}
            codes={restCodes}
            value={value}
            disabled={disabled}
            onSelect={select}
            onRemove={remove}
            onClaimed={(wallet) => select(wallet.id)}
          />
        </div>
      )}
      {codeSlot}
      {message && <FormAlert message={message} />}
      {totals}
    </div>
  );
}
