"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/toast/useToast";
import { useUpdateMechanicLocation } from "@/hooks/mechanic";
import type { MechanicBookingStatus } from "@/lib/mechanic/mechanic.types";

const SAMPLE_INTERVAL_MS = 20_000;

export function useTravelRouteSharing(
  bookingId: string | null,
  status: MechanicBookingStatus | null,
) {
  const toast = useToast();
  const saver = useUpdateMechanicLocation();
  const [sharing, setSharing] = useState(false);
  const sharingBookingIdRef = useRef<string | null>(null);
  const saveLocationRef = useRef(saver.mutate);
  const toastRef = useRef(toast);
  saveLocationRef.current = saver.mutate;
  toastRef.current = toast;

  useEffect(() => {
    if (!sharing) return;
    if (!bookingId || bookingId !== sharingBookingIdRef.current || status !== "en_route") {
      sharingBookingIdRef.current = null;
      setSharing(false);
      return;
    }
    if (!("geolocation" in navigator)) {
      sharingBookingIdRef.current = null;
      setSharing(false);
      toastRef.current.error(
        "Thiết bị không hỗ trợ định vị",
        "Không thể chia sẻ lộ trình cho khách.",
      );
      return;
    }

    let active = true;
    let lastSavedAt = 0;
    let saving = false;
    let saveErrorShown = false;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (saving || now - lastSavedAt < SAMPLE_INTERVAL_MS) return;
        lastSavedAt = now;
        saving = true;
        saveLocationRef.current(
          {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            currentJobId: bookingId,
            currentJobType: "booking",
          },
          {
            onSuccess: () => {
              saving = false;
              saveErrorShown = false;
            },
            onError: () => {
              saving = false;
              if (active && !saveErrorShown) {
                saveErrorShown = true;
                toastRef.current.error("Không lưu được lộ trình", "Vui lòng thử lại.");
              }
            },
          },
        );
      },
      () => {
        if (!active) return;
        sharingBookingIdRef.current = null;
        setSharing(false);
        toastRef.current.error(
          "Không lấy được vị trí",
          "Hãy cho phép trình duyệt truy cập vị trí.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
    );
    return () => {
      active = false;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [bookingId, sharing, status]);

  function toggleSharing(): boolean {
    if (sharing) {
      sharingBookingIdRef.current = null;
      setSharing(false);
      toast.info("Đã dừng chia sẻ lộ trình", "Vị trí mới sẽ không được ghi nhận.");
      return true;
    }
    if (status !== "en_route" || !bookingId) return false;
    if (!("geolocation" in navigator)) {
      toast.error(
        "Thiết bị không hỗ trợ định vị",
        "Không thể chia sẻ lộ trình cho khách.",
      );
      return true;
    }
    sharingBookingIdRef.current = bookingId;
    setSharing(true);
    toast.info(
      "Đang chia sẻ lộ trình",
      "Vị trí được ghi nhận khi đơn đang di chuyển.",
    );
    return true;
  }

  return { sharing, toggleSharing };
}
