"use client";

import { useParams } from "next/navigation";
import { ProductDetail } from "./ProductDetail";
import { ProductsLanding } from "./ProductsLanding";

// Mounted once by the /products layout. The slug segment decides which
// screen renders: no slug means the shop landing, a slug means the part
// detail. The detail keeps its centred container; the landing is full width.
// Category tabs on the landing live in `?cat=` so they never remount the shell.
export function ProductsRouteShell() {
  const params = useParams();
  const raw = params.slug;
  const slug = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);
  if (slug) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <ProductDetail slug={slug} />
      </div>
    );
  }
  return <ProductsLanding />;
}
