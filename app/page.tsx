import type { Metadata } from "next";
import { HomeCtaBand } from "@/components/home/HomeCtaBand";
import { HomeHero } from "@/components/home/HomeHero";
import { MechanicsBento } from "@/components/home/mechanics/MechanicsBento";
import { ServicesBento } from "@/components/home/services/ServicesBento";
import { StepsBento } from "@/components/home/steps/StepsBento";
import { TestimonialsBento } from "@/components/home/testimonials/TestimonialsBento";
import { PromoBannerSection } from "@/components/promotions/PromoBannerSection";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";
import { listLandingReviews } from "@/lib/home/landing-reviews.service";
import { listShowcaseMechanics } from "@/lib/home/mechanic-showcase.service";

export const metadata: Metadata = {
  title: "FlashWrench - Sửa xe lưu động tận nơi",
  description:
    "Đặt thợ sửa xe lưu động, cứu hộ khẩn cấp 24/7 với bảng giá minh bạch.",
};

export default async function HomePage() {
  // Server-side reads run in parallel; each service degrades to [] on any
  // outage and the matching section then removes itself.
  const [mechanics, realReviews] = await Promise.all([
    listShowcaseMechanics(),
    listLandingReviews(),
  ]);
  return (
    <main className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      <HomeHero />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <PromoBannerSection />
      </div>
      <ServicesBento />
      <StepsBento />
      <MechanicsBento items={mechanics} />
      <TestimonialsBento realItems={realReviews} />
      <HomeCtaBand />
      <SpeculationRules scope="home" />
    </main>
  );
}
