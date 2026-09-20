"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/toast/useToast";
import type { MapPoint } from "./MapPicker";

type UseLocatePositionOptions = {
  pinnedRef: React.RefObject<boolean>;
  onPoint: (point: MapPoint) => void;
};

// Geolocation for the booking map: precise GPS first with a coarse
// network fallback, a silent auto-locate on mount plus a manual button
// path. `onlyIfUnpinned` keeps the auto fix from overriding a point the
// customer already chose.
export function useLocatePosition({
  pinnedRef,
  onPoint,
}: UseLocatePositionOptions) {
  const toast = useToast();
  const [locating, setLocating] = useState(false);

  const onPointRef = useRef(onPoint);
  useEffect(() => {
    onPointRef.current = onPoint;
  });

  function locate(silent: boolean, onlyIfUnpinned: boolean) {
    if (!("geolocation" in navigator)) {
      if (!silent) {
        toast.error(
          "Thiết bị không hỗ trợ định vị",
          "Hãy chạm trực tiếp lên bản đồ để ghim vị trí.",
        );
      }
      return;
    }
    setLocating(true);

    function applyPosition(position: GeolocationPosition) {
      setLocating(false);
      if (onlyIfUnpinned && pinnedRef.current) return;
      onPointRef.current({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    }

    function fail() {
      setLocating(false);
      if (!silent) {
        toast.error(
          "Không lấy được vị trí hiện tại",
          "Kiểm tra quyền định vị hoặc chạm trực tiếp lên bản đồ.",
        );
      }
    }

    // Precise GPS first; indoors it can time out, so fall back to the
    // coarse network fix instead of leaving the picker unfound.
    navigator.geolocation.getCurrentPosition(
      applyPosition,
      (geoError) => {
        if (
          geoError.code === geoError.POSITION_UNAVAILABLE ||
          geoError.code === geoError.TIMEOUT
        ) {
          navigator.geolocation.getCurrentPosition(applyPosition, fail, {
            timeout: 10_000,
            maximumAge: 60_000,
          });
          return;
        }
        fail();
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 },
    );
  }

  // Latest locate closure for the mount-once default; refs keep the
  // effect out of the dependency graph without going stale.
  const locateRef = useRef<typeof locate>(() => {});
  useEffect(() => {
    locateRef.current = locate;
  });
  useEffect(() => locateRef.current(true, true), []);

  return { locating, locate };
}
