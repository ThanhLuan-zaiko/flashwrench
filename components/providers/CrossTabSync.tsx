"use client";

import { useCrossTabSync } from "@/hooks/useCrossTabSync";

// Renders nothing: it only hosts the same-browser tab sync listener, inside
// the query and toast providers it depends on.
export function CrossTabSync() {
  useCrossTabSync();
  return null;
}
