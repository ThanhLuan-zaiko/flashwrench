"use client";

import { useState } from "react";
import { FiEdit2, FiPlus } from "react-icons/fi";
import { useAdminZones } from "@/hooks/admin-rescue";
import { ZoneDialog, type ZoneDialogState } from "./ZoneDialog";

// Zone directory: every service zone with radius and active state.
// Retiring uses the edit toggle, never delete, so rescue history and
// zone references stay valid.
export function ZoneListCard() {
  const zones = useAdminZones();
  const [dialog, setDialog] = useState<ZoneDialogState | null>(null);
  const items = zones.data?.items ?? [];

  return (
    <section
      aria-label="Vùng phục vụ"
      className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Vùng phục vụ ({items.length})
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Điểm ghim rơi vào vùng nào thì ca thuộc vùng đó.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ mode: "create" })}
          className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <FiPlus aria-hidden="true" className="h-4 w-4" />
          Thêm
        </button>
      </div>

      {zones.isPending ? (
        <p className="py-6 text-center text-sm text-zinc-500">Đang tải…</p>
      ) : zones.isError || items.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">
          {zones.isError
            ? "Không tải được. Vui lòng thử lại."
            : "Chưa có vùng nào — mọi ca đang broadcast toàn hệ thống."}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {items.map((zone) => (
            <li
              key={zone.zoneId}
              className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 px-3 py-2.5 dark:border-zinc-800"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {zone.name}
                  {!zone.isActive && (
                    <span className="ml-2 rounded-full border border-zinc-300 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                      Tắt
                    </span>
                  )}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                  {zone.city ?? "—"} · Bán kính {zone.radiusKm ?? "—"} km
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDialog({ mode: "edit", item: zone })}
                aria-label={`Sửa ${zone.name}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <FiEdit2 aria-hidden="true" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {dialog && (
        <ZoneDialog
          key={dialog.mode === "edit" ? dialog.item.zoneId : "create"}
          state={dialog}
          onClose={() => setDialog(null)}
        />
      )}
    </section>
  );
}
