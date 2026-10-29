"use client";

import { useMemo } from "react";
import { BRAND_CHIP_ACTIVE, BRAND_CHIP_IDLE } from "@/components/ui/brand";
import { BookingDateTimeInput } from "./BookingFormFields";
import {
  bookingDayOptions,
  bookingTimeSlots,
  parseHoursLabel,
  splitScheduled,
} from "./booking-slot-options";

type BookingSlotPickerProps = {
  value: string;
  min: string;
  max: string;
  hoursLabel?: string | null;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

const PILL =
  "flex min-h-[44px] items-center justify-center rounded-2xl border font-bold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] disabled:cursor-not-allowed disabled:opacity-40 motion-safe:active:scale-[0.98] dark:focus-visible:ring-zinc-100";

// Day pills plus hourly slot buttons over the same datetime-local value
// the form validates. Any other time stays reachable through the native
// picker, which opens by itself when the value is off-grid or flagged.
export function BookingSlotPicker({
  value,
  min,
  max,
  hoursLabel,
  error,
  disabled,
  onChange,
}: BookingSlotPickerProps) {
  const openWindow = useMemo(() => parseHoursLabel(hoursLabel), [hoursLabel]);
  const days = useMemo(
    () => bookingDayOptions(min, max, new Date()),
    [min, max],
  );
  const current = splitScheduled(value);
  const slots = useMemo(
    () => bookingTimeSlots(current.day, min, max, openWindow),
    [current.day, min, max, openWindow],
  );
  const onGrid = slots.includes(current.time);

  const pickDay = (day: string) => {
    const daySlots = bookingTimeSlots(day, min, max, openWindow);
    const time = daySlots.includes(current.time)
      ? current.time
      : (daySlots[0] ?? current.time);
    onChange(`${day}T${time}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <fieldset className="m-0 grid min-w-0 grid-cols-4 gap-2 border-0 p-0 sm:grid-cols-7">
        <legend className="sr-only">Chọn ngày</legend>
        {days.map((day) => {
          const active = day.value === current.day;
          const empty =
            bookingTimeSlots(day.value, min, max, openWindow).length === 0;
          return (
            <button
              key={day.value}
              type="button"
              aria-pressed={active}
              disabled={disabled || empty}
              onClick={() => pickDay(day.value)}
              className={`${PILL} flex-col gap-0.5 py-2 ${active ? BRAND_CHIP_ACTIVE : BRAND_CHIP_IDLE}`}
            >
              <span className="text-[11px] font-semibold">{day.weekday}</span>
              <span className="text-lg leading-none">{day.day}</span>
            </button>
          );
        })}
      </fieldset>
      {slots.length > 0 && (
        <fieldset className="m-0 grid min-w-0 grid-cols-3 gap-2 border-0 p-0 sm:grid-cols-5">
          <legend className="sr-only">Chọn giờ</legend>
          {slots.map((time) => {
            const active = onGrid && time === current.time;
            return (
              <button
                key={time}
                type="button"
                aria-pressed={active}
                disabled={disabled}
                onClick={() => onChange(`${current.day}T${time}`)}
                className={`${PILL} text-sm ${active ? BRAND_CHIP_ACTIVE : BRAND_CHIP_IDLE}`}
              >
                {time}
              </button>
            );
          })}
        </fieldset>
      )}
      <details
        open={Boolean(error) || !onGrid}
        className="group rounded-2xl border border-dashed border-zinc-300 px-3 py-2 dark:border-zinc-700"
      >
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center text-sm font-semibold text-[#1E3A5F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A5F] dark:text-zinc-100">
          Chọn ngày giờ khác
        </summary>
        <div className="pt-1 pb-2">
          <BookingDateTimeInput
            id="scheduledAt"
            value={value}
            min={min}
            max={max}
            onChange={onChange}
            error={error}
            disabled={disabled}
          />
        </div>
      </details>
    </div>
  );
}
