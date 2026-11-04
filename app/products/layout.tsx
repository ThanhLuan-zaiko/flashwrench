import type { ReactNode } from "react";
import { PRODUCTS_TOUR_STEPS } from "@/components/products/tour/products-tour.steps";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";
import { TourProvider } from "@/components/tour/TourProvider";

// Frame shared by the shop list and the product detail. The list lives in the
// (shop) route group; the detail is a real page, so Next.js opens it at the
// top and restores the list position on Back.
export default function ProductsLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col overflow-x-clip bg-white dark:bg-zinc-950">
      <TourProvider steps={PRODUCTS_TOUR_STEPS}>{children}</TourProvider>
      <SpeculationRules scope="products" />
    </main>
  );
}
