"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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

  return (
    <div>
      <label
        htmlFor="rescue-assign-mechanic"
        className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
      >
        Gán thợ tay (gần nhất trước)
      </label>
      <div className="mt-1.5 flex gap-2">
        <select
          id="rescue-assign-mechanic"
          value={mechanicId}
          onChange={(e) => setMechanicId(e.target.value)}
          disabled={action.isPending}
          className="min-h-[44px] w-full flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        >
          <option value="">Chọn thợ…</option>
          {(mechanics.data?.mechanics ?? []).map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
              {m.distanceKm !== null ? ` · ${m.distanceKm} km` : ""}
            </option>
          ))}
        </select>
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
              { onSuccess: () => onDone("Đã giao thợ"), onError: onFail },
            )
          }
          className="flex min-h-[44px] shrink-0 items-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-zinc-900"
        >
          Giao
        </button>
      </div>
    </div>
  );
}
