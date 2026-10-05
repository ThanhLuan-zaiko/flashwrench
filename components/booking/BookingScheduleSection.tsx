import { BookingDateTimeInput, BookingField } from "./BookingFormFields";

type BookingScheduleSectionProps = {
  value: string;
  min: string;
  max: string;
  leadDays: number;
  maxDays: number;
  // e.g. "07:00–20:00" when the shop restricts intake to its open window.
  hoursLabel?: string | null;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

// Schedule step: one datetime input bounded by the admin-tuned intake
// window (lead floor + advance cap + working hours). The slot is a wish
// staff confirm later — matching the service validation.
export function BookingScheduleSection({
  value,
  min,
  max,
  leadDays,
  maxDays,
  hoursLabel,
  error,
  disabled,
  onChange,
}: BookingScheduleSectionProps) {
  const floor =
    leadDays > 0
      ? `Đặt trước ít nhất ${leadDays} ngày`
      : "Có thể đặt trong ngày";
  const cap = maxDays > 0 ? `, xa nhất ${maxDays} ngày tới` : "";
  const hours = hoursLabel ? `, trong giờ làm việc ${hoursLabel}` : "";
  return (
    <BookingField
      id="scheduledAt"
      label="Khung giờ mong muốn"
      required
      error={error}
      hint={`${floor}${cap}${hours}. Shop sẽ liên hệ chốt lại giờ cụ thể.`}
    >
      <BookingDateTimeInput
        id="scheduledAt"
        value={value}
        min={min}
        max={max}
        onChange={onChange}
        error={error}
        disabled={disabled}
      />
    </BookingField>
  );
}
