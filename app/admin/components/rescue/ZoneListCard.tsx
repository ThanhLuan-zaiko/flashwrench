"use client";

import { useState } from "react";
import { FiEdit2, FiPlus } from "react-icons/fi";
import { StaffEmptyState } from "@/components/staff/StaffEmptyState";
import { STAFF_ART } from "@/components/staff/staff-art";
import { ListNoMatch, ListSearchField } from "@/components/ui/ListSearchField";
import { useAdminZones } from "@/hooks/admin-rescue";
import { matchesSearch } from "@/lib/search-text";
import { ZoneDialog, type ZoneDialogState } from "./ZoneDialog";

// Zone directory: every service zone with radius and active state.
// Retiring uses the edit toggle, never delete, so rescue history and
// zone references stay valid.
export function ZoneListCard() {
  const zones = useAdminZones();
  const [dialog, setDialog] = useState<ZoneDialogState | null>(null);
  const items = zones.data?.items ?? [];
  const [query, setQuery] = useState("");
  const visible = items.filter((zone) =>
    matchesSearch(query, [zone.name, zone.city]),
  );

  return (
    <section
      aria-label="Vùng phục vụ"
      data-tour="admin-rescue-zones"
      className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Vùng phục vụ ({items.length})
          </h2>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
            Điểm ghim rơi vào vùng nào thì ca thuộc vùng đó.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ mode: "create" })}
          className="flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-200 motion-safe:active:scale-[0.99] bg-[#1D4ED8] text-white hover:bg-[#1E40AF] dark:bg-[#60A5FA] dark:text-[#111111] dark:hover:bg-[#93C5FD]"
        >
          <FiPlus aria-hidden="true" className="h-4 w-4" />
          Thêm
        </button>
      </div>

      {zones.isPending ? (
        <p className="py-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Đang tải…
        </p>
      ) : zones.isError ? (
        <p className="py-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Không tải được. Vui lòng thử lại.
        </p>
      ) : items.length === 0 ? (
        <StaffEmptyState
          art={STAFF_ART.towTruck}
          title="Chưa có vùng nào"
          hint="Mọi ca đang được gửi tới toàn hệ thống."
        />
      ) : (
        <>
          <div className="mt-3">
            <ListSearchField
              id="zone-search"
              value={query}
              onChange={setQuery}
              placeholder="Tên vùng, thành phố…"
            />
          </div>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {visible.map((zone) => (
              <li
                key={zone.zoneId}
                className="flex items-center justify-between gap-2 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {zone.name}
                    {!zone.isActive && (
                      <span className="ml-2 rounded-full border border-zinc-300 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                        Tắt
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
                    {zone.city ?? "—"} · Bán kính {zone.radiusKm ?? "—"} km
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDialog({ mode: "edit", item: zone })}
                  aria-label={`Sửa ${zone.name}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-800 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <FiEdit2 aria-hidden="true" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          {visible.length === 0 && <ListNoMatch />}
        </>
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
