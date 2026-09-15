"use client";

import type { ComplaintRefType } from "@/lib/complaints/complaint.types";
import { fieldError } from "../services/catalog-errors";
import { SelectDropdown } from "../services/SelectDropdown";
import { COMPLAINT_REF_LABELS } from "./complaint-format";

type ComplaintCreateFieldsProps = {
  reporterName: string;
  reporterPhone: string;
  targetName: string;
  refType: ComplaintRefType;
  refId: string;
  subject: string;
  body: string;
  error: unknown;
  onReporterName: (value: string) => void;
  onReporterPhone: (value: string) => void;
  onTargetName: (value: string) => void;
  onRefType: (value: ComplaintRefType) => void;
  onRefId: (value: string) => void;
  onSubject: (value: string) => void;
  onBody: (value: string) => void;
};

const REF_OPTIONS = Object.entries(COMPLAINT_REF_LABELS).map(
  ([value, label]) => ({ value, label }),
);

const INPUT =
  "h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

const LABEL =
  "flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300";

// Create form of the complaint dialog: reporter, target, reference,
// subject and body with inline field errors. Extracted to keep the
// dialog under the 250-line limit.
export function ComplaintCreateFields({
  reporterName,
  reporterPhone,
  targetName,
  refType,
  refId,
  subject,
  body,
  error,
  onReporterName,
  onReporterPhone,
  onTargetName,
  onRefType,
  onRefId,
  onSubject,
  onBody,
}: ComplaintCreateFieldsProps) {
  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={LABEL}>
          Người phản ánh
          <input
            value={reporterName}
            onChange={(e) => onReporterName(e.target.value)}
            placeholder="Nguyễn Văn A"
            className={INPUT}
          />
          {fieldError(error, "reporterName") && (
            <span className="font-medium text-red-600 dark:text-red-400">
              {fieldError(error, "reporterName")}
            </span>
          )}
        </label>
        <label className={LABEL}>
          Số điện thoại
          <input
            value={reporterPhone}
            onChange={(e) => onReporterPhone(e.target.value)}
            inputMode="tel"
            placeholder="0912345678"
            className={INPUT}
          />
          {fieldError(error, "reporterPhone") && (
            <span className="font-medium text-red-600 dark:text-red-400">
              {fieldError(error, "reporterPhone")}
            </span>
          )}
        </label>
      </div>
      <label className={LABEL}>
        Người bị phản ánh (nếu có)
        <input
          value={targetName}
          onChange={(e) => onTargetName(e.target.value)}
          placeholder="Tên thợ hoặc tài khoản liên quan"
          className={INPUT}
        />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SelectDropdown
          label="Liên quan đến"
          value={refType}
          options={REF_OPTIONS}
          onChange={(v) => onRefType(v as ComplaintRefType)}
          listLabel="Chọn loại liên quan"
          unitName="loại"
        />
        <label className={LABEL}>
          Mã liên quan (nếu có)
          <input
            value={refId}
            onChange={(e) => onRefId(e.target.value)}
            placeholder="Mã booking, đơn hàng…"
            className={INPUT}
          />
        </label>
      </div>
      <label className={LABEL}>
        Tiêu đề
        <input
          value={subject}
          onChange={(e) => onSubject(e.target.value)}
          placeholder="Thợ đến trễ 2 giờ không báo trước"
          className={INPUT}
        />
        {fieldError(error, "subject") && (
          <span className="font-medium text-red-600 dark:text-red-400">
            {fieldError(error, "subject")}
          </span>
        )}
      </label>
      <label className={LABEL}>
        Nội dung
        <textarea
          value={body}
          onChange={(e) => onBody(e.target.value)}
          rows={3}
          placeholder="Diễn biến chi tiết sự việc…"
          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
        {fieldError(error, "body") && (
          <span className="font-medium text-red-600 dark:text-red-400">
            {fieldError(error, "body")}
          </span>
        )}
      </label>
    </div>
  );
}
