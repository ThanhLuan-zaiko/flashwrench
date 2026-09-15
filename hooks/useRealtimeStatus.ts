"use client";

import { useEffect, useState } from "react";
import {
  type RealtimeStatus,
  subscribeRealtimeStatus,
} from "@/lib/realtime/realtime-client";

export type { RealtimeStatus };

export function useRealtimeStatus(): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>("offline");
  useEffect(() => subscribeRealtimeStatus(setStatus), []);
  return status;
}
