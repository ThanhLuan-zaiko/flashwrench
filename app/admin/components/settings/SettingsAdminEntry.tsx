"use client";

import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { useBookingConfigRealtime } from "@/hooks/booking-config";
import {
  useBusinessHoursRealtime,
  useShopProfileRealtime,
} from "@/hooks/shop-settings";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { BookingPolicyCard } from "./BookingPolicyCard";
import { BusinessHoursCard } from "./BusinessHoursCard";
import { PolicySnapshotCard } from "./PolicySnapshotCard";
import { SettingsNav } from "./SettingsNav";
import { ShopProfileCard } from "./ShopProfileCard";

// Admin settings root: shop-wide operational knobs that used to be code
// constants. Sections are anchored (see settings-sections.ts) so the nav
// chips can jump straight to a domain as the page grows.
export function SettingsAdminEntry() {
  const rootRef = useBentoReveal<HTMLDivElement>();
  // A retune from another admin tab or session refreshes the cards live.
  useBookingConfigRealtime(true);
  useShopProfileRealtime(true);
  useBusinessHoursRealtime(true);

  return (
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        eyebrow="Cài đặt cửa hàng"
        title="Vận hành theo nhân lực."
        subtitle="Các tham số áp dụng ngay cho đơn mới — đơn đã đặt giữ nguyên trạng thái."
      />
      <SettingsNav />
      <section id="overview" className="scroll-mt-36">
        <PolicySnapshotCard />
      </section>
      <section id="booking" className="scroll-mt-36">
        <BookingPolicyCard />
      </section>
      <section id="hours" className="scroll-mt-36">
        <BusinessHoursCard />
      </section>
      <section id="shop" className="scroll-mt-36">
        <ShopProfileCard />
      </section>
    </div>
  );
}
