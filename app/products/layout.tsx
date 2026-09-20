import type { ReactNode } from "react";
import { Suspense } from "react";
import { ProductsRouteShell } from "@/components/products/ProductsRouteShell";

// Shared shell for /products and /products/[slug]. Next.js keeps the
// layout mounted while only the slug or query changes, so the landing
// state (search text, cached catalog) survives tab switches without
// replaying the GSAP enter animation. Pages stay metadata-only.
export default function ProductsLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <Suspense fallback={null}>
          <ProductsRouteShell />
        </Suspense>
        {children}
      </div>
    </main>
  );
}
