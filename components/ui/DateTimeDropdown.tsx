"use client";

import { FiCalendar } from "react-icons/fi";
import { DateTimePanel } from "@/components/ui/DateTimePanel";
import {
  dateTimeLabel,
  splitDateTime,
} from "@/components/ui/date-time-dropdown.utils";
import { PickerField } from "@/components/ui/PickerField";
import type { PopupWidth } from "@/components/ui/popup-position";
import { TimeTextInput } from "@/components/ui/TimeTextInput";

type DateTimeDropdownProps = {
  id: string;
  /** Local `YYYY-MM-DDTHH:mm`, or empty when nothing is picked yet. */
  value: string;
  /** Limits for the month arrows; empty means no limit. */
  min?: string;
  max?: string;
  /** Selectable `HH:mm` values for a `YYYY-MM-DD` day; stable reference. */
  timesFor: (day: string) => string[];
  onChange: (value: string) => void;
  /** Why a typed `HH:mm` cannot be used on a day, or null when it can. */
  validateTime?: (day: string, time: string) => string | null;
  /** Time used when a day is picked while no valid time is set yet. */
  defaultTime?: string;
  /** Shows a clear action for optional fields. */
  clearable?: boolean;
  /** Stacks the time list under the grid, for narrow form columns. */
  stacked?: boolean;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
};

const FIELD_WIDTH: PopupWidth = (trigger) => trigger;
const WIDE_ABOVE_PHONE: PopupWidth = (trigger, viewport) =>
  viewport >= 640 ? 448 : trigger;

// Date and time field. Browser datetime inputs look different on every
// platform, so forms use this: picking a day keeps the popup open, picking a
// time closes it.
export function DateTimeDropdown({
  id,
  value,
  min = "",
  max = "",
  timesFor,
  onChange,
  validateTime,
  defaultTime,
  clearable,
  stacked,
  placeholder = "Chọn ngày giờ",
  disabled,
  error,
}: DateTimeDropdownProps) {
  const current = splitDateTime(value);

  const pickDay = (day: string) => {
    const times = timesFor(day);
    let time = times[0] ?? current.time;
    const typedStillFits =
      Boolean(validateTime) &&
      Boolean(current.time) &&
      validateTime?.(day, current.time) === null;
    if (times.includes(current.time) || typedStillFits) time = current.time;
    else if (defaultTime && times.includes(defaultTime)) time = defaultTime;
    onChange(`${day}T${time}`);
  };

  return (
    <PickerField
      id={id}
      label={dateTimeLabel(value)}
      placeholder={placeholder}
      icon={FiCalendar}
      panelLabel="Chọn ngày và giờ"
      panelWidth={stacked ? FIELD_WIDTH : WIDE_ABOVE_PHONE}
      disabled={disabled}
      error={error}
    >
      {(close) => (
        <>
          <DateTimePanel
            value={value}
            min={min}
            max={max}
            timesFor={timesFor}
            stacked={stacked}
            onPickDay={pickDay}
            onPickTime={(time) => {
              onChange(`${current.day}T${time}`);
              close();
            }}
          />
          <TimeTextInput
            validate={(time) => {
              if (!current.day) return "Chọn ngày trước khi nhập giờ.";
              return validateTime?.(current.day, time) ?? null;
            }}
            onCommit={(time) => {
              onChange(`${current.day}T${time}`);
              close();
            }}
          />
          {clearable && value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                close();
              }}
              className="mt-2 min-h-9 rounded-xl px-2 text-sm font-semibold text-[#1D4ED8] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:text-blue-300 dark:focus-visible:ring-zinc-100"
            >
              Xóa ngày giờ
            </button>
          )}
        </>
      )}
    </PickerField>
  );
}
