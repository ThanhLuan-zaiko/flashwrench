"use client";

import { useState } from "react";
import { FiLoader, FiPackage } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { useDispatchParts, useSetPartStock } from "@/hooks/dispatch-orders";
import { AuthApiError } from "@/services/auth.api";

type StockRowProps = {
  partId: string;
  sku: string;
  name: string;
  price: number;
  stockQty: number;
};

// One stock row with an inline qty editor. Dispatchers set absolute stock
// after a count or a restock delivery; +/- relative edits stay in admin.
function StockRow({ partId, sku, name, price, stockQty }: StockRowProps) {
  const setStock = useSetPartStock();
  const [draft, setDraft] = useState(String(stockQty));
  const [error, setError] = useState("");
  const dirty = draft !== String(stockQty);

  const save = () => {
    const next = Number.parseInt(draft, 10);
    if (!Number.isInteger(next) || next < 0) {
      setError("Số lượng phải là số nguyên không âm.");
      return;
    }
    setError("");
    setStock.mutate(
      { partId, stockQty: next },
      {
        onError: (err) =>
          setError(
            err instanceof AuthApiError
              ? ((err.errors as Record<string, string | undefined>).form ??
                  err.message)
              : "Không cập nhật được tồn kho.",
          ),
      },
    );
  };

  return (
    <li className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {name}
        </span>
        <span className="block font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {sku} · {formatVnd(price)}
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError("");
          }}
          inputMode="numeric"
          aria-label={`Tồn kho ${name}`}
          className="h-11 w-24 rounded-xl border border-zinc-300 bg-white px-3 text-center text-sm font-semibold text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
        <button
          type="button"
          disabled={!dirty || setStock.isPending}
          onClick={save}
          className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {setStock.isPending && (
            <FiLoader
              aria-hidden="true"
              className="h-3.5 w-3.5 motion-safe:animate-spin"
            />
          )}
          Lưu
        </button>
      </span>
      {error && (
        <span role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </li>
  );
}

// Quick stock panel for the orders board: every active part with an
// inline absolute-quantity editor so the packer can correct counts while
// fulfilling orders.
export function StockPanel() {
  const parts = useDispatchParts();
  const items = (parts.data?.parts ?? []).filter((p) => !p.isDeleted);

  if (parts.isPending) {
    return (
      <div
        aria-busy="true"
        className="flex items-center gap-2 py-4 text-xs text-zinc-500 dark:text-zinc-400"
      >
        <FiLoader
          aria-hidden="true"
          className="h-4 w-4 motion-safe:animate-spin"
        />
        Đang tải tồn kho…
      </div>
    );
  }
  if (parts.isError) {
    return (
      <div className="py-4 text-center">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Không tải được tồn kho.
        </p>
        <button
          type="button"
          onClick={() => void parts.refetch()}
          className="mx-auto mt-3 flex min-h-[44px] items-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Thử lại
        </button>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Chưa có sản phẩm nào trong kho.
      </p>
    );
  }
  return (
    <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
      {items.map((part) => (
        <StockRow
          key={part.id}
          partId={part.id}
          sku={part.sku}
          name={part.name}
          price={part.price}
          stockQty={part.stockQty}
        />
      ))}
      <li className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-zinc-500 dark:text-zinc-400">
        <FiPackage aria-hidden="true" className="h-3.5 w-3.5" />
        Đặt số lượng tuyệt đối sau khi kiểm kê hoặc nhập hàng.
      </li>
    </ul>
  );
}
