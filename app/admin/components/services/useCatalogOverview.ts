"use client";

import { useMemo } from "react";
import {
  FiCheckCircle,
  FiDollarSign,
  FiLayers,
  FiPauseCircle,
} from "react-icons/fi";
import {
  useCatalogServices,
  useServiceCategories,
} from "@/hooks/service-catalog";
import type { ServiceStat } from "../bento/ServicesStatCard";

// Live overview: one query per aggregate (deleted included), derived live
// vs trash lists plus bento stats. Keeps ServicesSection under limits.
export function useCatalogOverview(categoryFilter: string) {
  const categoriesQuery = useServiceCategories(true);
  const servicesQuery = useCatalogServices({ includeDeleted: true });

  const categories = useMemo(
    () => categoriesQuery.data?.categories ?? [],
    [categoriesQuery.data],
  );
  const services = useMemo(
    () => servicesQuery.data?.services ?? [],
    [servicesQuery.data],
  );
  const liveCategories = useMemo(
    () => categories.filter((c) => !c.isDeleted),
    [categories],
  );
  const trashCategories = useMemo(
    () => categories.filter((c) => c.isDeleted),
    [categories],
  );
  const liveServices = useMemo(
    () => services.filter((s) => !s.isDeleted),
    [services],
  );
  const trashServices = useMemo(
    () => services.filter((s) => s.isDeleted),
    [services],
  );
  const visibleServices = useMemo(
    () =>
      liveServices.filter((s) =>
        categoryFilter ? s.categoryId === categoryFilter : true,
      ),
    [liveServices, categoryFilter],
  );
  const activeCount =
    liveCategories.filter((c) => c.isActive).length +
    liveServices.filter((s) => s.isActive).length;

  const stats: ServiceStat[] = [
    {
      id: "groups",
      label: "Nhóm dịch vụ",
      value: String(liveCategories.length),
      hint: "Loại hình đang dùng",
      icon: FiLayers,
    },
    {
      id: "active",
      label: "Đang áp dụng",
      value: String(activeCount),
      hint: "Hiển thị cho khách hàng",
      icon: FiCheckCircle,
    },
    {
      id: "paused",
      label: "Tạm tắt",
      value: String(liveCategories.length + liveServices.length - activeCount),
      hint: "Ẩn khỏi khách",
      icon: FiPauseCircle,
    },
    {
      id: "prices",
      label: "Mục giá",
      value: String(liveServices.length),
      hint: `Thùng rác: ${trashCategories.length + trashServices.length}`,
      icon: FiDollarSign,
    },
  ];

  return {
    categoriesQuery,
    servicesQuery,
    liveCategories,
    trashCategories,
    liveServices,
    trashServices,
    visibleServices,
    stats,
  };
}
