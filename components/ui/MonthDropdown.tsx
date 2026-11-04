"use client";

import { useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { BRAND_CHIP_ACTIVE } from "@/components/ui/brand";
import {
  PICKER_CELL,
  PICKER_CELL_IDLE,
  PICKER_NAV_BUTTON,
} from "@/components/ui/CalendarGrid";
import {
  monthKey,
  monthLabel,
  monthOf,
} from "@/components/ui/date-time-dropdown.utils";
import { PickerField } from "@/components/ui/PickerField";

type MonthDropdownProps = {
  id: string;
  /** `YYYY-MM`. */
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
};

const MONTH_GRID_WIDTH = () => 288;
const MONTHS = Array.from({ length: 12 }, (_, month) => month);

function MonthGrid({
  value,
  onPick,
}: {
  value: string;
  onPick: (value: string) => void;
}) {
  const [year, setYear] = useState(() => monthOf(value, new Date()).year);
  return (
    <>
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Năm trước"
          onClick={() => setYear((y) => y - 1)}
          className={PICKER_NAV_BUTTON}
        >
          <FiChevronLeft aria-hidden="true" className="h-5 w-5" />
        </button>
        <p
          aria-live="polite"
          className="text-sm font-bold text-zinc-900 dark:text-zinc-50"
        >
          Năm {year}
        </p>
        <button
          type="button"
          aria-label="Năm sau"
          onClick={() => setYear((y) => y + 1)}
          className={PICKER_NAV_BUTTON}
        >
          <FiChevronRight aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-1 grid grid-cols-3 gap-1">
        {MONTHS.map((month) => {
          const key = monthKey({ year, month });
          const active = key === value;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => onPick(key)}
              className={`${PICKER_CELL} min-h-10 ${active ? BRAND_CHIP_ACTIVE : PICKER_CELL_IDLE}`}
            >
              Tháng {month + 1}
            </button>
          );
        })}
      </div>
    </>
  );
}

// Month-only field for the partition pickers on staff boards.
export function MonthDropdown({
  id,
  value,
  onChange,
  className,
  disabled,
}: MonthDropdownProps) {
  return (
    <PickerField
      id={id}
      label={value ? monthLabel(monthOf(value, new Date())) : ""}
      placeholder="Chọn tháng"
      icon={FiCalendar}
      panelLabel="Chọn tháng"
      panelWidth={MONTH_GRID_WIDTH}
      className={className}
      disabled={disabled}
    >
      {(close) => (
        <MonthGrid
          value={value}
          onPick={(next) => {
            onChange(next);
            close();
          }}
        />
      )}
    </PickerField>
  );
}
