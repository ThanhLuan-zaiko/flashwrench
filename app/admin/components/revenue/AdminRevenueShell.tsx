"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { RangeGuidance } from "@/components/revenue/RangeGuidance";
import { RevenueBoard } from "@/components/revenue/RevenueBoard";
import {
  isRevenueRangeParam,
  todayAnchor,
} from "@/components/revenue/revenue-format";
import {
  useAdminRevenue,
  usePaymentAudit,
  useRevenueRealtime,
} from "@/hooks/revenue";
import { adminRevenueCsvHref } from "@/services/revenue.api";
import { AuditFeedCard } from "./AuditFeedCard";
import { FraudFlagsCard } from "./FraudFlagsCard";

// Admin revenue screen: the shared board (with staff columns enabled) plus
// a second bento section for the anti-fraud flags and the audit feed.
export function AdminRevenueShell() {
  const params = useParams();
  const raw = params.range;
  const slug = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);
  const [anchor, setAnchor] = useState(todayAnchor());

  useRevenueRealtime();
  const range = isRevenueRangeParam(slug) ? slug : "day";
  const report = useAdminRevenue({ range, anchor });
  const audit = usePaymentAudit({ range, anchor });

  if (!isRevenueRangeParam(slug)) {
    return <RangeGuidance basePath="/admin/revenue" />;
  }

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <RevenueBoard
        range={slug}
        basePath="/admin/revenue"
        anchor={anchor}
        onAnchorChange={setAnchor}
        csvHref={(next) => adminRevenueCsvHref({ range: slug, anchor: next })}
        report={report.data}
        isPending={report.isPending}
        isError={report.isError}
        staffSlices
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
        <FraudFlagsCard flags={report.data?.flags ?? []} />
        <AuditFeedCard
          events={audit.data?.events}
          label={audit.data?.label}
          isPending={audit.isPending}
          isError={audit.isError}
        />
      </div>
    </div>
  );
}
