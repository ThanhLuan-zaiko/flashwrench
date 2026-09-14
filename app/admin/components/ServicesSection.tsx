"use client";

import {
  FiCheckCircle,
  FiDollarSign,
  FiLayers,
  FiPauseCircle,
} from "react-icons/fi";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { ServicePricesCard } from "./bento/ServicePricesCard";
import { ServicesHeroCard } from "./bento/ServicesHeroCard";
import { type ServiceStat, ServicesStatCard } from "./bento/ServicesStatCard";
import { ServiceTypesCard } from "./bento/ServiceTypesCard";

const SERVICE_STATS: ServiceStat[] = [
  {
    id: "groups",
    label: "Nhóm dịch vụ",
    value: "3",
    hint: "Bảo dưỡng · Sửa chữa · Cứu hộ",
    icon: FiLayers,
  },
  {
    id: "active",
    label: "Đang áp dụng",
    value: "3/3",
    hint: "Hiển thị cho khách hàng",
    icon: FiCheckCircle,
  },
  {
    id: "paused",
    label: "Tạm tắt",
    value: "0",
    hint: "Không có nhóm nào bị ẩn",
    icon: FiPauseCircle,
  },
  {
    id: "prices",
    label: "Mục giá",
    value: "—",
    hint: "Chờ API danh mục",
    icon: FiDollarSign,
  },
];

// Bento overview: big type statement, hero plus stats, catalogue cards.
export function ServicesSection() {
  const rootRef = useBentoReveal<HTMLDivElement>();

  return (
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        eyebrow="Cấu hình dịch vụ"
        title="Giá rõ, bật tắt gọn."
        subtitle="Ba nhóm dịch vụ, một bảng giá minh bạch cho mọi khách hàng."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
        <ServicesHeroCard />
        {SERVICE_STATS.map((stat) => (
          <ServicesStatCard key={stat.id} stat={stat} />
        ))}
        <ServiceTypesCard />
        <ServicePricesCard />
      </div>
    </div>
  );
}
