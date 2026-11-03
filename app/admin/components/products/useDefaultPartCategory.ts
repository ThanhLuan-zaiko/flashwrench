"use client";

import { type Dispatch, type SetStateAction, useEffect } from "react";
import type { PartCategoryItem, PartItem } from "@/lib/parts/parts.types";

// Keeps the category select on a live category. The category list can arrive
// after the dialog mounts, so the default is applied by effect.
export function useDefaultPartCategory(
  editing: PartItem | null,
  categoryId: string,
  setCategoryId: Dispatch<SetStateAction<string>>,
  live: PartCategoryItem[],
  liveFirstId: string,
): void {
  useEffect(() => {
    if (editing || live.length === 0) return;
    if (!categoryId || !live.some((c) => c.id === categoryId)) {
      if (liveFirstId) setCategoryId(liveFirstId);
    }
  }, [editing, categoryId, live, liveFirstId, setCategoryId]);
}
