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
  useAdminCustomerMix,
  useCustomerMixRealtime,
} from "@/hooks/customer-mix";

// Admin member-vs-guest screen: the shared board fed by the admin-scoped
// endpoint. Mounted once by the customer-mix layout; the range comes from
// the URL so tab switches never replay the reveal.
export function AdminCustomerMixShell() {
  const params = useParams();
  const raw = params.range;
  const slug = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);
  const [anchor, setAnchor] = useState(todayAnchor());

  useCustomerMixRealtime();
  const range = isMixRangeParam(slug) ? slug : "day";
  const report = useAdminCustomerMix({ range, anchor });

  if (!isMixRangeParam(slug)) {
    return (
      <RangeGuidance
        basePath="/admin/customer-mix"
        tabs={MIX_RANGE_TABS}
        hint="Hãy chọn một khoảng bên dưới để xem báo cáo nguồn khách."
      />
    );
  }

  return (
    <CustomerMixBoard
      range={slug}
      basePath="/admin/customer-mix"
      anchor={anchor}
      onAnchorChange={setAnchor}
      report={report.data}
      isPending={report.isPending}
      isError={report.isError}
    />
  );
}
