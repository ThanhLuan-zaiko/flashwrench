"use client";

import { useEffect, useMemo, useRef } from "react";
import { FiClock } from "react-icons/fi";
import { BRAND_CHIP_ACTIVE } from "@/components/ui/brand";
import { PICKER_CELL, PICKER_CELL_IDLE } from "@/components/ui/CalendarGrid";
import {
  quarterHourTimes,
  scrollWithinBox,
  withExtraTimes,
} from "@/components/ui/date-time-dropdown.utils";
import { PickerField } from "@/components/ui/PickerField";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";
import { TimeTextInput } from "@/components/ui/TimeTextInput";

type TimeDropdownProps = {
  id: string;
  /** Local `HH:mm`. */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
};

const TIME_LIST_WIDTH = (trigger: number) => Math.max(trigger, 160);

function TimeList({
  times,
  value,
  onPick,
}: {
  times: string[];
  value: string;
  onPick: (time: string) => void;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    scrollWithinBox(selectedRef.current);
  }, []);
  return (
    <div
      className={`relative grid max-h-60 grid-cols-1 gap-1 overflow-y-auto ${SCROLLBAR_CLASSES}`}
    >
      {times.map((time) => {
        const active = time === value;
        return (
          <button
            key={time}
            ref={active ? selectedRef : undefined}
            type="button"
            aria-pressed={active}
            onClick={() => onPick(time)}
            className={`${PICKER_CELL} min-h-9 shrink-0 ${active ? BRAND_CHIP_ACTIVE : PICKER_CELL_IDLE}`}
          >
            {time}
          </button>
        );
      })}
    </div>
  );
}

// Time-only field with a quarter-hour list; a saved value off that grid
// stays in the list.
export function TimeDropdown({
  id,
  value,
  onChange,
  disabled,
  error,
}: TimeDropdownProps) {
  const times = useMemo(
    () => withExtraTimes(quarterHourTimes(), value),
    [value],
  );
  return (
    <PickerField
      id={id}
      label={value}
      placeholder="Chọn giờ"
      icon={FiClock}
      panelLabel="Chọn giờ"
      panelWidth={TIME_LIST_WIDTH}
      disabled={disabled}
      error={error}
    >
      {(close) => (
        <>
          <TimeList
            times={times}
            value={value}
            onPick={(time) => {
              onChange(time);
              close();
            }}
          />
          <TimeTextInput
            onCommit={(time) => {
              onChange(time);
              close();
            }}
          />
        </>
      )}
    </PickerField>
  );
}
