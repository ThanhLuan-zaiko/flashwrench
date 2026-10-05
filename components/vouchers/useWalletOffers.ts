"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useClaimableCodes } from "@/hooks/useVoucherCode";
import { useMyWallets } from "@/hooks/useVouchers";
import {
  nearMissWallets,
  nextAutoSelection,
  pickPrimaryOffer,
  rankClaimableCodes,
  rankUsableWallets,
} from "@/lib/vouchers/voucher-offers";
import type { VoucherKind } from "@/lib/vouchers/voucher-pick";

// Offer state for one picker: ranked usable wallets, near-misses and
// claimable codes, plus the auto-apply bookkeeping. Once the customer
// removes the auto pick (or picks by hand) auto-apply stands down.
export function useWalletOffers({
  kind,
  subtotal,
  value,
  disabled,
  onChange,
}: {
  kind: VoucherKind;
  subtotal: number;
  value: string | null;
  disabled?: boolean;
  onChange: (walletId: string | null) => void;
}) {
  // The picker needs every usable wallet, not just the newest page —
  // ask for the bounded max so none is hidden behind pagination.
  const wallets = useMyWallets(true, { limit: 100 });
  const codesQuery = useClaimableCodes(kind, true);
  const [optedOut, setOptedOut] = useState(false);
  const [autoAppliedId, setAutoAppliedId] = useState<string | null>(null);
  // Callers pass inline onChange lambdas — a ref keeps the auto-apply
  // effect from re-running on every render.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const items = wallets.data?.items ?? [];
  const usable = useMemo(
    () => rankUsableWallets(items, kind, subtotal),
    [items, kind, subtotal],
  );
  const near = useMemo(
    () => nearMissWallets(items, kind, subtotal),
    [items, kind, subtotal],
  );
  const codes = useMemo(
    () =>
      rankClaimableCodes(codesQuery.isSuccess ? codesQuery.data : [], subtotal),
    [codesQuery.isSuccess, codesQuery.data, subtotal],
  );
  const primary = useMemo(
    () => pickPrimaryOffer({ usable, near, codes, value }),
    [usable, near, codes, value],
  );

  const usableIds = useMemo(
    () => usable.map((entry) => entry.wallet.id),
    [usable],
  );
  // Auto-pick the best usable wallet once data lands, and re-pick when
  // the auto-picked voucher stops being usable or stops being the best.
  useEffect(() => {
    if (!wallets.isSuccess || disabled) return;
    const next = nextAutoSelection({
      value,
      autoAppliedId,
      optedOut,
      usableIds,
    });
    if (next === undefined) return;
    setAutoAppliedId(next);
    if (next !== value) onChangeRef.current(next);
  }, [wallets.isSuccess, disabled, value, autoAppliedId, optedOut, usableIds]);

  const selectedUsable =
    usable.find((entry) => entry.wallet.id === value) ?? null;

  function select(id: string) {
    onChange(id);
  }

  function remove() {
    setOptedOut(true);
    onChange(null);
  }

  return {
    wallets,
    codesQuery,
    usable,
    near,
    codes,
    primary,
    selectedUsable,
    selectedDiscount: selectedUsable?.discount ?? 0,
    autoApplied: value !== null && value === autoAppliedId,
    select,
    remove,
  };
}
