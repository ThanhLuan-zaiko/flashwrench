import type { RescueFieldErrors } from "@/services/rescue.api";
import { BookingField, BookingTextArea } from "../booking/BookingFormFields";
import { RescueIssueSelect } from "./RescueIssueSelect";
import { RESCUE_ISSUE_OPTIONS } from "./rescue-constants";

type RescueIssueSectionProps = {
  issueType: string;
  description: string;
  errors: RescueFieldErrors;
  disabled: boolean;
  onIssueType: (value: string) => void;
  onDescription: (value: string) => void;
};

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
        <RescueIssueSelect
          id="rescue-issueType"
          value={issueType}
          onChange={onIssueType}
          error={errors.issueType}
          disabled={disabled}
        />
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
