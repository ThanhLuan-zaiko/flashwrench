import type { ReactNode } from "react";
import { Suspense } from "react";
import { ProductsRouteShell } from "@/components/products/ProductsRouteShell";
import { PRODUCTS_TOUR_STEPS } from "@/components/products/tour/products-tour.steps";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";
import { TourProvider } from "@/components/tour/TourProvider";

// Shared shell for /products and /products/[slug]. Next.js keeps the
// layout mounted while only the slug or query changes, so the landing
// state (search text, cached catalog) survives tab switches without
// replaying the GSAP enter animation. Pages stay metadata-only. The shop
// landing is full width like the home chapters; the detail screen adds its
// own centred container inside the route shell.
export default function ProductsLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col overflow-x-clip bg-white dark:bg-zinc-950">
      <TourProvider steps={PRODUCTS_TOUR_STEPS}>
        <Suspense fallback={null}>
          <ProductsRouteShell />
        </Suspense>
        {children}
      </TourProvider>
      <SpeculationRules scope="products" />
    </main>
  );
}
