import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";
import {
  recordStatusLabel,
  recordSubtitle,
} from "@/components/guest-access/guest-access-format";
import {
  GUEST_RECORD_LABELS,
  type GuestRecordSummary,
} from "@/lib/guest-access/guest-access.types";
import {
  guestRecordHref,
  isActiveGuestRecord,
} from "./guest-records-menu.utils";

type GuestRecordMenuItemProps = {
  record: GuestRecordSummary;
  onNavigate: () => void;
};

// One job row in the header menu: kind, title, when, and current status.
// Active jobs read slightly stronger than finished ones (weight, not hue).
export function GuestRecordMenuItem({
  record,
  onNavigate,
}: GuestRecordMenuItemProps) {
  const active = isActiveGuestRecord(record);
  const subtitle = recordSubtitle(record);
  return (
    <Link
      href={guestRecordHref(record)}
      role="menuitem"
      onClick={onNavigate}
      className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:hover:bg-zinc-800"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          {GUEST_RECORD_LABELS[record.type]}
        </span>
        <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {record.title}
        </span>
        {subtitle && (
          <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </span>
        )}
      </span>
      <span
        className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${
          active
            ? "border-zinc-900 font-semibold text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
            : "border-zinc-300 font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        }`}
      >
        {recordStatusLabel(record.status)}
      </span>
      <FiChevronRight
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500"
      />
    </Link>
  );
}
