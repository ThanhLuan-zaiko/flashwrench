import type { Metadata } from "next";
import { CategoriesChapter } from "@/components/home/categories/CategoriesChapter";
import { HomeFaq } from "@/components/home/faq/HomeFaq";
import { HomeCtaBand } from "@/components/home/HomeCtaBand";
import { HomeHero } from "@/components/home/HomeHero";
import { MechanicsBento } from "@/components/home/mechanics/MechanicsBento";
import { HomePriceSection } from "@/components/home/pricing/HomePriceSection";
import { HomeProductsBento } from "@/components/home/products/HomeProductsBento";
import { HomePromoList } from "@/components/home/promotions/HomePromoList";
import { ServicesBento } from "@/components/home/services/ServicesBento";
import { StepsBento } from "@/components/home/steps/StepsBento";
import { TestimonialsBento } from "@/components/home/testimonials/TestimonialsBento";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";
import {
  listHeroServices,
  listHomeCategories,
  listHomePriceRange,
  listHomeProducts,
  listHomeServices,
} from "@/lib/home/home-catalog.service";
import { listLandingReviews } from "@/lib/home/landing-reviews.service";
import { listShowcaseMechanics } from "@/lib/home/mechanic-showcase.service";
import { loadCancelCutoffHours } from "@/lib/home/price-terms";

export const metadata: Metadata = {
  title: "FlashWrench - Sửa xe lưu động tận nơi",
  description:
    "Đặt thợ sửa xe lưu động, cứu hộ khẩn cấp 24/7 với bảng giá minh bạch.",
};

export default async function HomePage() {
  // Server-side reads run in parallel; each service degrades to [] (or
  // null) on any outage and the matching section or row removes itself.
  const [
    services,
    categories,
    heroServices,
    products,
    mechanics,
    realReviews,
    priceRange,
    cancelCutoffHours,
  ] = await Promise.all([
    listHomeServices(),
    listHomeCategories(),
    listHeroServices(),
    listHomeProducts(),
    listShowcaseMechanics(),
    listLandingReviews(),
    listHomePriceRange(),
    loadCancelCutoffHours(),
  ]);
  return (
    <main className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      <HomeHero heroServices={heroServices} />
      <HomePromoList />
      <CategoriesChapter items={categories} />
      <ServicesBento services={services} />
      <HomeProductsBento items={products} />
      <StepsBento />
      <HomePriceSection
        range={priceRange}
        cancelCutoffHours={cancelCutoffHours}
      />
      <MechanicsBento items={mechanics} />
      <TestimonialsBento realItems={realReviews} />
      <HomeFaq />
      <HomeCtaBand />
      <SpeculationRules scope="home" />
    </main>
  );
}
