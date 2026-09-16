"use client";

import { useEffect, useRef, useState } from "react";
import { FiNavigation } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import {
  useNavigationBoard,
  useUpdateMechanicLocation,
} from "@/hooks/mechanic";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import { MapPanel } from "./MapPanel";
import { NavigationHeader } from "./NavigationHeader";
import { NavigationList } from "./NavigationList";
import { googleDirectionsUrl } from "./navigation-directions";

// Bento root for navigation: an embedded live map of the current job,
// every open job with distance and ETA, one-tap directions, and a GPS
// share button that feeds the same origin the distances are computed from.
export function NavigationSection() {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const toast = useToast();
  const board = useNavigationBoard();
  const saver = useUpdateMechanicLocation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const firstLoad = useRef(true);

  const targets = board.data?.board.targets ?? [];
  const origin = board.data?.board.origin ?? null;

  useEffect(() => {
    if (!board.data || firstLoad.current === false) return;
    firstLoad.current = false;
    const current = board.data.board.currentJobId;
    if (current && targets.some((target) => target.bookingId === current)) {
      setSelectedId(current);
    } else if (targets[0]) {
      setSelectedId(targets[0].bookingId);
    }
  }, [board.data, targets]);

  const selected =
    targets.find((target) => target.bookingId === selectedId) ?? targets[0];

  const shareLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error(
        "Thiết bị không hỗ trợ định vị",
        "Hãy mở bản đồ ngoài để xem đường đi.",
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        saver.mutate(
          {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            currentJobId: selected?.bookingId,
            currentJobType: selected ? "booking" : "none",
          },
          {
            onSuccess: () => {
              setLocating(false);
              toast.success(
                "Đã cập nhật vị trí",
                "Bản đồ tính lại quãng đường.",
              );
            },
            onError: () => {
              setLocating(false);
              toast.error("Không lưu được vị trí", "Vui lòng thử lại.");
            },
          },
        );
      },
      () => {
        setLocating(false);
        toast.error(
          "Không lấy được vị trí",
          "Hãy cho phép trình duyệt truy cập vị trí.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <div ref={rootRef} className="flex flex-col gap-3 md:gap-4">
      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-4">
        <BentoCard label="Bản đồ điểm sửa" className="lg:col-span-3">
          <NavigationHeader
            loading={board.isPending}
            originLabel={origin?.label ?? null}
            jobCount={targets.length}
            locating={locating || saver.isPending}
            onShare={shareLocation}
          />
          <MapPanel origin={origin} target={selected ?? null} />
          {selected && (
            <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-zinc-200 p-3 sm:flex-row sm:items-center dark:border-zinc-800">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {selected.customerName || "Khách hàng"}
                </p>
                <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {selected.addressText}
                </p>
              </div>
              <a
                href={googleDirectionsUrl(origin, selected)}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <FiNavigation aria-hidden="true" className="h-4 w-4" />
                Chỉ đường
              </a>
            </div>
          )}
        </BentoCard>
        <BentoCard label="Đơn đang mở">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Đơn đang mở
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Sắp xếp theo quãng đường gần nhất
          </p>
          <NavigationList
            loading={board.isPending}
            isError={board.isError}
            targets={targets}
            selectedId={selected?.bookingId ?? null}
            onSelect={setSelectedId}
            onRetry={() => void board.refetch()}
          />
        </BentoCard>
      </div>
      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        Khoảng cách và thời gian là ước tính; tuyến đường chính xác nằm trong
        ứng dụng bản đồ khi bạn bấm “Chỉ đường”.
      </p>
    </div>
  );
}
