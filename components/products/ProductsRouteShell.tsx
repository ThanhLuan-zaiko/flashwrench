"use client";

import { useParams } from "next/navigation";
import { ProductDetail } from "./ProductDetail";
import { ProductsLanding } from "./ProductsLanding";

// Mounted once by the /products layout. The slug segment decides which
// screen renders: no slug means the shop landing, a slug means the part
// detail. Category tabs on the landing live in `?cat=` so they never
// remount the shell.
export function ProductsRouteShell() {
  const params = useParams();
  const raw = params.slug;
  const slug = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);
  if (slug) return <ProductDetail slug={slug} />;
  return <ProductsLanding />;
}
