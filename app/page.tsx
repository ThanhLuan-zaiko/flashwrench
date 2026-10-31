import type { Metadata } from "next";
import { HomeCtaBand } from "@/components/home/HomeCtaBand";
import { HomeHero } from "@/components/home/HomeHero";
import { MechanicsBento } from "@/components/home/mechanics/MechanicsBento";
import { HomePriceSection } from "@/components/home/pricing/HomePriceSection";
import { HomeProductsBento } from "@/components/home/products/HomeProductsBento";
import { ServicesBento } from "@/components/home/services/ServicesBento";
import { StepsBento } from "@/components/home/steps/StepsBento";
import { TestimonialsBento } from "@/components/home/testimonials/TestimonialsBento";
import { PromoBannerSection } from "@/components/promotions/PromoBannerSection";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";
import {
  listHeroServices,
  listHomeProducts,
  listHomeServices,
} from "@/lib/home/home-catalog.service";
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
  const [services, heroServices, products, mechanics, realReviews] =
    await Promise.all([
      listHomeServices(),
      listHeroServices(),
      listHomeProducts(),
      listShowcaseMechanics(),
      listLandingReviews(),
    ]);
  return (
    <main className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      <HomeHero heroServices={heroServices} />
      <div className="w-full px-4 pt-10 sm:px-6 md:pt-14 lg:px-10">
        <PromoBannerSection />
      </div>
      <ServicesBento services={services} />
      <HomeProductsBento items={products} />
      <StepsBento />
      <HomePriceSection services={services} />
      <MechanicsBento items={mechanics} />
      <TestimonialsBento realItems={realReviews} />
      <HomeCtaBand />
      <SpeculationRules scope="home" />
    </main>
  );
}
