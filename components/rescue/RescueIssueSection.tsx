import type { RescueFieldErrors } from "@/services/rescue.api";
import { BookingField, BookingTextArea } from "../booking/BookingFormFields";
import { RESCUE_ISSUE_OPTIONS } from "./rescue-constants";

type RescueIssueSectionProps = {
  issueType: string;
  description: string;
  errors: RescueFieldErrors;
  disabled: boolean;
  onIssueType: (value: string) => void;
  onDescription: (value: string) => void;
};

const SELECT_BASE =
  "min-h-[44px] w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus-visible:ring-2 dark:bg-zinc-950 dark:text-zinc-50";
const SELECT_OK =
  "border-zinc-300 focus-visible:ring-zinc-500 dark:border-zinc-700";
const SELECT_ERROR =
  "border-red-500 focus-visible:ring-red-500 dark:border-red-400";

// Issue step: one required breakdown type plus an optional free-text
// description so dispatch can send the right tools.
export function RescueIssueSection({
  issueType,
  description,
  errors,
  disabled,
  onIssueType,
  onDescription,
}: RescueIssueSectionProps) {
  const active =
    RESCUE_ISSUE_OPTIONS.find((o) => o.value === issueType) ?? null;
  return (
    <div className="flex flex-col gap-4">
      <BookingField
        id="rescue-issueType"
        label="Sự cố đang gặp"
        required
        error={errors.issueType}
        hint={active ? active.hint : "Chọn tình huống gần nhất với xe của bạn."}
      >
        <select
          id="rescue-issueType"
          value={issueType}
          onChange={(event) => onIssueType(event.target.value)}
          disabled={disabled}
          aria-invalid={Boolean(errors.issueType)}
          className={`${SELECT_BASE} ${errors.issueType ? SELECT_ERROR : SELECT_OK}`}
        >
          <option value="">Chọn sự cố…</option>
          {RESCUE_ISSUE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </BookingField>
      <BookingField
        id="rescue-description"
        label="Mô tả thêm"
        error={errors.description}
        hint="Ví dụ: xe tắt máy ở làn phải, có mùi khét nhẹ."
      >
        <BookingTextArea
          id="rescue-description"
          value={description}
          onChange={onDescription}
          placeholder="Mô tả dấu hiệu xe để thợ chuẩn bị đồ nghề (không bắt buộc)"
          error={errors.description}
          disabled={disabled}
        />
      </BookingField>
    </div>
  );
}
