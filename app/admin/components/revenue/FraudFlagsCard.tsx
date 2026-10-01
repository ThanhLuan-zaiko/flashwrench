import { FiAlertTriangle } from "react-icons/fi";
import type { FraudFlag, FraudFlagKind } from "@/lib/revenue/revenue.types";
import { BentoCard } from "../bento/BentoCard";

const FLAG_LABELS: Record<FraudFlagKind, string> = {
  "unconfirmed-cod": "Tiền mặt thiếu xác nhận",
  "collector-mismatch": "Người thu lệch thợ phụ trách",
  "cash-concentration": "Dồn tiền mặt bất thường",
  "rapid-repeat": "Thu lặp trong thời gian ngắn",
};

// Admin-only anti-bribery flags: heuristics over the range's receipts.
// Rows are informational — investigating stays a human decision.
export function FraudFlagsCard({ flags }: { flags: FraudFlag[] }) {
  return (
    <BentoCard label="Dấu hiệu bất thường" className="sm:col-span-2">
      <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        <FiAlertTriangle aria-hidden="true" className="h-4 w-4" />
        Dấu hiệu bất thường
      </p>
      {flags.length === 0 ? (
        <p className="mt-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Không có dấu hiệu nào trong kỳ này.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {flags.slice(0, 8).map((flag) => (
            <li
              key={`${flag.kind}-${flag.refId ?? ""}-${flag.actorId ?? ""}-${flag.detail}`}
              className="py-2.5 text-xs"
            >
              <p className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    flag.severity === "critical"
                      ? "border-red-300 text-red-700 dark:border-red-800 dark:text-red-300"
                      : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {flag.severity === "critical" ? "Nghiêm trọng" : "Cảnh báo"}
                </span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {FLAG_LABELS[flag.kind]}
                </span>
              </p>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                {flag.detail}
              </p>
            </li>
          ))}
        </ul>
      )}
    </BentoCard>
  );
}
