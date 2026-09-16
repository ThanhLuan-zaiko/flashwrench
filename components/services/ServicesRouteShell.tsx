"use client";

import { useParams } from "next/navigation";
import { ServicesLanding } from "./ServicesLanding";

// Mounted once by the /services layout, so it survives tab switches between
// /services and /services/[slug]. The slug comes from the URL on every
// navigation: search text and the cached catalog are reused, only the pager
// resets, and the enter animation never replays for a mere tab switch.
export function ServicesRouteShell() {
  const params = useParams();
  const raw = params.slug;
  const activeSlug = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);
  return <ServicesLanding activeSlug={activeSlug} />;
}
