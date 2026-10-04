import { FiClock } from "react-icons/fi";
import { formatDuration } from "@/app/admin/components/services/catalog-format";

export function BookingDuration({
  durationMin,
}: {
  durationMin: number | null;
}) {
  if (!durationMin || durationMin <= 0) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
      <FiClock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      Thời lượng dự kiến: {formatDuration(durationMin)}
    </p>
  );
}
