"use client";

import { useMemo } from "react";
import { usePendingStaffPasswords } from "@/hooks/admin";
import { useStaffPasswordRealtime } from "@/hooks/useStaffPasswordRealtime";

// Pending temp-password data for the ids the staff tab already shows:
// a { userId: tempPassword } map plus the crypto flag (false means
// STAFF_TEMP_SECRET is missing, so nothing could be persisted).
// Realtime events invalidate the query, keeping entries in sync.
export function useStaffPendingMap(userIds: string[], enabled: boolean) {
  useStaffPasswordRealtime(enabled);
  const query = usePendingStaffPasswords(userIds, enabled);
  const pendingMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const item of query.data?.items ?? []) {
      map[item.userId] = item.tempPassword;
    }
    return map;
  }, [query.data]);
  return {
    pendingMap,
    cryptoConfigured: query.data?.cryptoConfigured ?? true,
    isPending: query.isPending,
  };
}
