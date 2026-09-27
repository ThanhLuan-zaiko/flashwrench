"use client";

import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { SlaConfigCard } from "./SlaConfigCard";
import { ZoneListCard } from "./ZoneListCard";

// Admin rescue root: SLA tuning plus the service zone directory. Zones
// decide which rescues land in a zone topic; the SLA decides offer
// lifetime, re-offer caps and fan-out per pass.
export function RescueAdminEntry() {
  const rootRef = useBentoReveal<HTMLDivElement>();

  return (
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        eyebrow="Cứu hộ khẩn cấp"
        title="Vùng chuẩn, giao nhanh."
        subtitle="Vùng phục vụ quyết định ca thuộc về đâu, cấu hình quyết định hệ thống giao thợ ra sao."
      />
      <div className="grid grid-cols-1 gap-3 md:gap-4 xl:grid-cols-2">
        <SlaConfigCard />
        <ZoneListCard />
      </div>
    </div>
  );
}
