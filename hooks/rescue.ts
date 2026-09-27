"use client";

import { useMutation } from "@tanstack/react-query";
import type { CreateRescueInput } from "@/services/rescue.api";
import { createRescueRequest } from "@/services/rescue.api";

export const rescueKeys = {
  all: ["rescue"] as const,
  create: ["rescue", "create"] as const,
};

// Public rescue creation. No optimistic update: dispatch needs the
// server-stored row first, so the form waits for 201 then shows the
// confirmation panel with the hotline hint.
export function useCreateRescue() {
  return useMutation({
    mutationFn: (payload: CreateRescueInput) => createRescueRequest(payload),
    retry: false,
  });
}
