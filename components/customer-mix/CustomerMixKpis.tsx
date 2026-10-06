import type { IconType } from "react-icons";
import { FiKey, FiLogIn, FiUser, FiUserCheck } from "react-icons/fi";
import { BentoCard } from "@/app/admin/components/bento/BentoCard";
import { formatPercent } from "@/components/revenue/revenue-format";
import type { CustomerMixReport } from "@/lib/customer-mix/customer-mix.types";

type Kpi = {
  label: string;
  value: string;
  hint: string;
  icon: IconType;
};

// Four 1x1 stat cells: created orders and verified sign-ins, each split
// member vs guest. Signups ride on the member-login hint — they are the
// guest-to-member conversion the whole report exists to show.
export function CustomerMixKpis({
  report,
  tour,
}: {
  report: CustomerMixReport;
  /** Spotlight-tour anchor; lands on the first KPI cell. */
  tour?: string;
}) {
  const t = report.totals;
  const orders = t.memberOrders + t.guestOrders;
  const kpis: Kpi[] = [
    {
      label: "Đơn thành viên",
      value: String(t.memberOrders),
      hint: `${t.memberBuyers} khách duy nhất · ${formatPercent(t.memberOrders, orders)} tổng đơn`,
      icon: FiUserCheck,
    },
    {
      label: "Đơn vãng lai",
      value: String(t.guestOrders),
      hint: `${t.guestBuyers} khách duy nhất · ${formatPercent(t.guestOrders, orders)} tổng đơn`,
      icon: FiUser,
    },
    {
      label: "Đăng nhập thành viên",
      value: String(t.memberLogins),
      hint: `${t.memberLoginActors} khách duy nhất · ${t.memberSignups} đăng ký mới`,
      icon: FiLogIn,
    },
    {
      label: "Đăng nhập vãng lai",
      value: String(t.guestLogins),
      hint: `${t.guestLoginActors} email duy nhất qua OTP`,
      icon: FiKey,
    },
  ];
  return (
    <>
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <BentoCard
            key={kpi.label}
            label={kpi.label}
            tour={index === 0 ? tour : undefined}
          >
            <p className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {kpi.label}
              </span>
            </p>
            <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
              {kpi.value}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {kpi.hint}
            </p>
          </BentoCard>
        );
      })}
    </>
  );
}
