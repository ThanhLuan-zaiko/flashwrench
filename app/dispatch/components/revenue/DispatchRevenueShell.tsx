"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { RangeGuidance } from "@/components/revenue/RangeGuidance";
import { RevenueBoard } from "@/components/revenue/RevenueBoard";
import {
  isRevenueRangeParam,
  todayAnchor,
} from "@/components/revenue/revenue-format";
import { useDispatchRevenue, useRevenueRealtime } from "@/hooks/revenue";
import { dispatchRevenueCsvHref } from "@/services/revenue.api";

// Mounted once by the /dispatch/revenue layout; the range comes from the
// URL so tab switches reuse the screen without replaying the reveal.
export function DispatchRevenueShell() {
  const params = useParams();
  const raw = params.range;
  const slug = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);
  const [anchor, setAnchor] = useState(todayAnchor());

  useRevenueRealtime();
  const range = isRevenueRangeParam(slug) ? slug : "day";
  const query = useDispatchRevenue({ range, anchor });

  if (!isRevenueRangeParam(slug)) {
    return <RangeGuidance basePath="/dispatch/revenue" />;
  }

  return (
    <RevenueBoard
      range={slug}
      basePath="/dispatch/revenue"
      anchor={anchor}
      onAnchorChange={setAnchor}
      csvHref={(next) => dispatchRevenueCsvHref({ range: slug, anchor: next })}
      report={query.data}
      isPending={query.isPending}
      isError={query.isError}
    />
  );
}
