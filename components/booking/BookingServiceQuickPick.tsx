import { FiPlus } from "react-icons/fi";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";

type BookingServiceQuickPickProps = {
  services: ServiceItem[];
  disabled?: boolean;
  onPick: (id: string) => void;
};

const QUICK_PICK_LIMIT = 4;

// One-tap shortcuts shown while nothing is picked yet, so the first
// step does not depend on opening the dropdown.
export function BookingServiceQuickPick({
  services,
  disabled,
  onPick,
}: BookingServiceQuickPickProps) {
  const picks = services.slice(0, QUICK_PICK_LIMIT);
  if (picks.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        Chọn nhanh
      </p>
      <ul className="flex flex-wrap gap-2">
        {picks.map((service) => (
          <li key={service.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(service.id)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-zinc-300 px-3 text-sm font-medium text-[#1E3A5F] transition-colors duration-200 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 disabled:opacity-50 motion-safe:active:scale-95 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              <FiPlus aria-hidden="true" className="h-4 w-4 shrink-0" />
              {service.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
