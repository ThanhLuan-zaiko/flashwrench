"use client";

import { useMemo } from "react";
import {
  FiCheckCircle,
  FiLayers,
  FiPackage,
  FiPauseCircle,
} from "react-icons/fi";
import { useAdminPartCategories, useAdminParts } from "@/hooks/admin-parts";
import type { ServiceStat } from "../bento/ServicesStatCard";

// Live overview: one query per aggregate (deleted included), derived live
// vs trash lists plus bento stats. Keeps ProductsSection under limits.
export function useProductsOverview(categoryFilter: string) {
  const categoriesQuery = useAdminPartCategories(true);
  const partsQuery = useAdminParts({ includeDeleted: true });

  const categories = useMemo(
    () => categoriesQuery.data?.categories ?? [],
    [categoriesQuery.data],
  );
  const parts = useMemo(() => partsQuery.data?.parts ?? [], [partsQuery.data]);
  const liveCategories = useMemo(
    () => categories.filter((c) => !c.isDeleted),
    [categories],
  );
  const trashCategories = useMemo(
    () => categories.filter((c) => c.isDeleted),
    [categories],
  );
  const liveParts = useMemo(() => parts.filter((p) => !p.isDeleted), [parts]);
  const trashParts = useMemo(() => parts.filter((p) => p.isDeleted), [parts]);
  const visibleParts = useMemo(
    () =>
      liveParts.filter((p) =>
        categoryFilter ? p.categoryId === categoryFilter : true,
      ),
    [liveParts, categoryFilter],
  );
  const activeCount =
    liveCategories.filter((c) => c.isActive).length +
    liveParts.filter((p) => p.isActive).length;

  const stats: ServiceStat[] = [
    {
      id: "categories",
      label: "Danh mục",
      value: String(liveCategories.length),
      hint: "Danh mục đang dùng",
      icon: FiLayers,
    },
    {
      id: "active",
      label: "Đang bán",
      value: String(activeCount),
      hint: "Hiển thị cho khách hàng",
      icon: FiCheckCircle,
    },
    {
      id: "paused",
      label: "Tạm tắt",
      value: String(liveCategories.length + liveParts.length - activeCount),
      hint: "Ẩn khỏi khách",
      icon: FiPauseCircle,
    },
    {
      id: "parts",
      label: "Sản phẩm",
      value: String(liveParts.length),
      hint: `Thùng rác: ${trashCategories.length + trashParts.length}`,
      icon: FiPackage,
    },
  ];

  return {
    categoriesQuery,
    partsQuery,
    liveCategories,
    trashCategories,
    liveParts,
    trashParts,
    visibleParts,
    stats,
  };
}
