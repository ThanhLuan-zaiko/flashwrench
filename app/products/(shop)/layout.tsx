import type { ReactNode } from "react";
import { Suspense } from "react";
import { ScrollTopOnEnter } from "@/components/layout/ScrollTopOnEnter";
import { ProductsLanding } from "@/components/products/ProductsLanding";

// Mounts the shop list once for /products and /products/page/N, so pager links
// and `?cat=` tabs keep the search text and cached catalog and never replay the
// enter animation. The leaves stay metadata-only.
export default function ProductsShopLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <ProductsLanding />
      </Suspense>
      <ScrollTopOnEnter />
      {children}
    </>
  );
}
