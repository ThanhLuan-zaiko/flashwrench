"use client";

import { FormAlert } from "@/components/auth/FormAlert";
import { useGuestInvoice } from "@/hooks/guest-access";
import type { GuestRecordType } from "@/lib/guest-access/guest-access.types";
import { GuestAccessApiError } from "@/services/guest-access.api";
import { GuestInvoicePanel } from "./GuestInvoicePanel";
import { OtpCodeStep, OtpRequestStep } from "./GuestOtpSteps";
import { GuestRecordList } from "./GuestRecordList";
import { useGuestLookupFlow } from "./useGuestLookupFlow";

/**
 * Layout for the OTP lookup: address -> code -> records -> invoice.
 *
 * Everything non-invoice is `print:hidden`, so "Tải PDF" prints the invoice
 * alone without needing a print stylesheet (globals.css must stay exactly two
 * lines per AGENTS.md).
 */
export function GuestLookupScreen() {
  const flow = useGuestLookupFlow();
  const { records, sent, selected, step } = flow;

  return (
    <div className="rounded-2xl border border-zinc-200 p-5 sm:p-6 dark:border-zinc-800">
      <div className="print:hidden">
        {step === "email" && (
          <OtpRequestStep
            email={flow.email}
            onEmail={flow.setEmail}
            onSubmit={flow.submitEmail}
            pending={flow.pendingRequest}
            formError={flow.requestError}
            fieldError={flow.requestError}
          />
        )}

        {step === "code" && sent && (
          <OtpCodeStep
            sent={sent}
            code={flow.code}
            onCode={flow.setCode}
            onSubmit={flow.submitCode}
            onResend={flow.resend}
            onBack={flow.backToEmail}
            pending={flow.pendingVerify}
            resendPending={flow.pendingRequest}
            resendAfterSeconds={flow.resendAfter}
            formError={flow.requestError}
            codeError={flow.verifyError}
          />
        )}

        {step === "records" && records.isPending && (
          <Loading label="Đang tải dịch vụ của bạn…" />
        )}

        {step === "records" && records.isError && (
          <div className="flex flex-col gap-3">
            <FormAlert
              message={messageOf(records.error, "Không tải được dữ liệu.")}
            />
            <RetryButton label="Xác minh lại" onClick={flow.reset} />
          </div>
        )}

        {step === "records" && records.isSuccess && (
          <GuestRecordList
            records={records.data.records}
            maskedEmail={records.data.maskedEmail}
            selected={selected}
            onSelect={(record) =>
              flow.setSelected({ type: record.type, id: record.id })
            }
            onReset={flow.reset}
          />
        )}
      </div>

      {selected && (
        <GuestInvoiceSlot
          type={selected.type}
          id={selected.id}
          onClose={() => flow.setSelected(null)}
        />
      )}
    </div>
  );
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof GuestAccessApiError
    ? (error.errors.form ?? fallback)
    : fallback;
}

function Loading({ label }: { label: string }) {
  return (
    <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
      {label}
    </p>
  );
}

function RetryButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:outline-none dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
    >
      {label}
    </button>
  );
}

// Split out so the invoice query only mounts once a row is picked.
function GuestInvoiceSlot({
  type,
  id,
  onClose,
}: {
  type: GuestRecordType;
  id: string;
  onClose: () => void;
}) {
  const invoice = useGuestInvoice(type, id, true);

  if (invoice.isPending) {
    return <Loading label="Đang tải hóa đơn…" />;
  }
  if (invoice.isError || !invoice.data) {
    return (
      <div className="print:hidden">
        <FormAlert
          message={messageOf(invoice.error, "Không tải được hóa đơn.")}
        />
      </div>
    );
  }
  return <GuestInvoicePanel invoice={invoice.data} onClose={onClose} />;
}
