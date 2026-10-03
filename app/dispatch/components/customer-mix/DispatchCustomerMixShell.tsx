"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { CustomerMixBoard } from "@/components/customer-mix/CustomerMixBoard";
import {
  isMixRangeParam,
  MIX_RANGE_TABS,
} from "@/components/customer-mix/customer-mix-format";
import { RangeGuidance } from "@/components/revenue/RangeGuidance";
import { todayAnchor } from "@/components/revenue/revenue-format";
import {
  useCustomerMixRealtime,
  useDispatchCustomerMix,
} from "@/hooks/customer-mix";

// Mounted once by the /dispatch/customer-mix layout; the range comes from
// the URL so tab switches reuse the screen without replaying the reveal.
export function DispatchCustomerMixShell() {
  const params = useParams();
  const raw = params.range;
  const slug = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);
  const [anchor, setAnchor] = useState(todayAnchor());

  useCustomerMixRealtime();
  const range = isMixRangeParam(slug) ? slug : "day";
  const report = useDispatchCustomerMix({ range, anchor });

  if (!isMixRangeParam(slug)) {
    return (
      <RangeGuidance
        basePath="/dispatch/customer-mix"
        tabs={MIX_RANGE_TABS}
        hint="Hãy chọn một khoảng bên dưới để xem báo cáo nguồn khách."
      />
    );
  }

  return (
    <CustomerMixBoard
      range={slug}
      basePath="/dispatch/customer-mix"
      anchor={anchor}
      onAnchorChange={setAnchor}
      report={report.data}
      isPending={report.isPending}
      isError={report.isError}
    />
  );
}
