"use client";

import { FiCalendar } from "react-icons/fi";
import { CalendarGrid } from "@/components/ui/CalendarGrid";
import { shortDateLabel } from "@/components/ui/date-time-dropdown.utils";
import { PickerField } from "@/components/ui/PickerField";

type DateDropdownProps = {
  id: string;
  /** Local `YYYY-MM-DD`. */
  value: string;
  onChange: (value: string) => void;
  /** Accessible name of the popup. */
  panelLabel?: string;
  className?: string;
  disabled?: boolean;
};

const ANY_DAY = () => true;
const CALENDAR_WIDTH = () => 304;

// Date-only field: picking a day closes the popup. The popup centers on the
// trigger so it stays on screen when the field sits between other controls.
export function DateDropdown({
  id,
  value,
  onChange,
  panelLabel = "Chọn ngày",
  className,
  disabled,
}: DateDropdownProps) {
  return (
    <PickerField
      id={id}
      label={shortDateLabel(value)}
      placeholder="Chọn ngày"
      icon={FiCalendar}
      panelLabel={panelLabel}
      panelWidth={CALENDAR_WIDTH}
      align="center"
      className={className}
      disabled={disabled}
    >
      {(close) => (
        <CalendarGrid
          day={value}
          isOpen={ANY_DAY}
          onPick={(day) => {
            onChange(day);
            close();
          }}
        />
      )}
    </PickerField>
  );
}
