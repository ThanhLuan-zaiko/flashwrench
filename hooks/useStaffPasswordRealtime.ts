"use client";

import { useQueryClient } from "@tanstack/react-query";
import { adminKeys } from "@/hooks/admin";
import { useRealtimeTopic } from "@/hooks/useRealtimeTopic";
import { STAFF_PASSWORDS_TOPIC } from "@/lib/realtime/protocol";

// First consumer of the realtime gateway: pending staff passwords vanish
// in realtime when their owner changes the password. Events carry only a
// userId signal; the decrypted list refetches over authenticated HTTPS.
export function useStaffPasswordRealtime(enabled = true) {
  const queryClient = useQueryClient();
  useRealtimeTopic(STAFF_PASSWORDS_TOPIC, {
    enabled,
    onEvent: () => {
      void queryClient.invalidateQueries({
        queryKey: adminKeys.pendingPasswordsRoot,
      });
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
    onReconnect: () => {
      void queryClient.invalidateQueries({
        queryKey: adminKeys.pendingPasswordsRoot,
      });
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}
