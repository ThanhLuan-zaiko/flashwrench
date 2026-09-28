"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FiLoader } from "react-icons/fi";
import { SelectDropdown } from "@/app/admin/components/services/SelectDropdown";
import {
  type RescueDetail,
  useDispatchRescueAction,
} from "@/hooks/rescue-inbox";
import { fetchAvailableMechanics } from "@/services/mechanics.api";

type RescueAssignSectionProps = {
  requestId: string;
  rescue: RescueDetail;
  version: string | null;
  onDone: (title: string) => void;
  onFail: () => void;
};

// Hand-assign picker: available mechanics nearest-first from the rescue
// pin, then one dispatcher claim that beats the 30s auto-offer.
export function RescueAssignSection({
  requestId,
  rescue,
  version,
  onDone,
  onFail,
}: RescueAssignSectionProps) {
  const action = useDispatchRescueAction();
  const [mechanicId, setMechanicId] = useState("");
  const mechanics = useQuery({
    queryKey: ["rescue-assign-mechanics", rescue.lat, rescue.lng],
    queryFn: () =>
      fetchAvailableMechanics({
        lat: rescue.lat ?? undefined,
        lng: rescue.lng ?? undefined,
        limit: 20,
      }),
    staleTime: 15 * 1000,
    retry: false,
  });
  const options = (mechanics.data?.mechanics ?? []).map((m) => ({
    value: m.id,
    label: `${m.displayName}${m.distanceKm !== null ? ` · ${m.distanceKm} km` : ""}`,
  }));

  return (
    <div className="flex items-end gap-2">
      {mechanics.isPending ? (
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Gán thợ tay (gần nhất trước)
          </p>
          <p className="mt-1.5 flex min-h-[44px] items-center gap-2 rounded-xl border border-zinc-300 px-3 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            <FiLoader
              aria-hidden="true"
              className="h-3.5 w-3.5 motion-safe:animate-spin"
            />
            Đang tải danh sách thợ…
          </p>
        </div>
      ) : (
        <SelectDropdown
          className="relative min-w-0 flex-1"
          label="Gán thợ tay (gần nhất trước)"
          id="rescue-assign-mechanic"
          value={mechanicId}
          options={options}
          onChange={setMechanicId}
          placeholder="Chọn thợ…"
          searchPlaceholder="Tìm thợ…"
          unitName="thợ"
          emptyTitle="Chưa có thợ khả dụng"
          emptyHint="Kiểm tra thợ đang trực trong khu vực"
          disabled={action.isPending}
        />
      )}
      <button
        type="button"
        disabled={action.isPending || !mechanicId}
        onClick={() =>
          action.mutate(
            {
              requestId,
              body: {
                action: "assign",
                mechanicId,
                expectedUpdatedAt: version,
              },
            },
            {
              onSuccess: () => {
                setMechanicId("");
                onDone("Đã giao thợ");
              },
              onError: onFail,
            },
          )
        }
        className="flex min-h-[44px] shrink-0 items-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-zinc-900"
      >
        Giao
      </button>
    </div>
  );
}
