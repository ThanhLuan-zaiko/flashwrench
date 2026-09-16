import { BookingDateTimeInput, BookingField } from "./BookingFormFields";

type BookingScheduleSectionProps = {
  value: string;
  min: string;
  max: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

// Schedule step: one datetime input bounded to the dispatch window
// (1 hour lead, 30 days ahead) matching the service validation.
export function BookingScheduleSection({
  value,
  min,
  max,
  error,
  disabled,
  onChange,
}: BookingScheduleSectionProps) {
  return (
    <BookingField
      id="scheduledAt"
      label="Khung giờ mong muốn"
      required
      error={error}
      hint="Chọn giờ sau hiện tại ít nhất 1 tiếng, trong vòng 30 ngày tới."
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
