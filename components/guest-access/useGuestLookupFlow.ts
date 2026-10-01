"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  guestAccessKeys,
  useGuestRecords,
  useOtpRequest,
  useOtpVerify,
} from "@/hooks/guest-access";
import type { GuestRecordType } from "@/lib/guest-access/guest-access.types";
import { GuestAccessApiError, type OtpSent } from "@/services/guest-access.api";

export type LookupStep = "email" | "code" | "records";

export type GuestLookupState = {
  step: LookupStep;
  email: string;
  code: string;
  sent: OtpSent | null;
  requestError: string | null;
  verifyError: string | null;
  resendAfter: number;
  selected: { type: GuestRecordType; id: string } | null;
  records: ReturnType<typeof useGuestRecords>;
  /** True while a code is being mailed, so both step buttons can lock. */
  pendingRequest: boolean;
  /** True while a submitted code is being checked. */
  pendingVerify: boolean;
  setEmail: (value: string) => void;
  setCode: (value: string) => void;
  setSelected: (value: { type: GuestRecordType; id: string } | null) => void;
  submitEmail: () => void;
  resend: () => void;
  submitCode: () => void;
  backToEmail: () => void;
  reset: () => void;
};

const CODE_TICK_MS = 1000;

function messageOf(error: unknown, fallback: string): string {
  if (error instanceof GuestAccessApiError) {
    return (
      error.errors.form ?? error.errors.code ?? error.errors.email ?? fallback
    );
  }
  return fallback;
}

/**
 * The OTP lookup flow as state, so the screen component stays a layout.
 *
 * The verified flag is derived from the records query rather than kept in
 * state: a refresh (or a second tab) lands straight on the list, because the
 * guest-access cookie already proves the address and TanStack re-reads the
 * cache on mount.
 */
export function useGuestLookupFlow(): GuestLookupState {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<LookupStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState<OtpSent | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [resendAfter, setResendAfter] = useState(0);
  const [selected, setSelected] = useState<{
    type: GuestRecordType;
    id: string;
  } | null>(null);

  const requestOtp = useOtpRequest();
  const verifyOtp = useOtpVerify();
  const records = useGuestRecords(step === "records");

  useEffect(() => {
    if (records.isSuccess) setStep("records");
    else if (records.isError) setStep("email");
  }, [records.isSuccess, records.isError]);

  useEffect(() => {
    if (resendAfter <= 0) return;
    const timer = setTimeout(() => {
      setResendAfter((value) => Math.max(0, value - 1));
    }, CODE_TICK_MS);
    return () => clearTimeout(timer);
  }, [resendAfter]);

  const submitEmail = useCallback(() => {
    setRequestError(null);
    requestOtp.mutate(email.trim(), {
      onSuccess: (data) => {
        setSent(data);
        setResendAfter(data.resendAfterSeconds);
        setStep("code");
      },
      onError: (error) => {
        setRequestError(
          messageOf(error, "Không gửi được mã. Vui lòng thử lại."),
        );
      },
    });
  }, [email, requestOtp]);

  const resend = useCallback(() => {
    setRequestError(null);
    requestOtp.mutate(email.trim(), {
      onSuccess: (data) => {
        setSent(data);
        setResendAfter(data.resendAfterSeconds);
      },
      onError: (error) => {
        setRequestError(messageOf(error, "Không gửi lại được mã."));
      },
    });
  }, [email, requestOtp]);

  const submitCode = useCallback(() => {
    setVerifyError(null);
    verifyOtp.mutate(
      { email: email.trim(), code },
      {
        onSuccess: () => {
          setCode("");
          setStep("records");
        },
        onError: (error) => {
          setVerifyError(messageOf(error, "Không xác minh được."));
        },
      },
    );
  }, [code, email, verifyOtp]);

  const backToEmail = useCallback(() => {
    setCode("");
    setVerifyError(null);
    setStep("email");
  }, []);

  const reset = useCallback(() => {
    // Dropping the cached list is what makes the screen ask for a code
    // again: the cookie may still be valid, but the visitor asked to switch
    // address, and re-showing the previous list would be misleading.
    queryClient.removeQueries({ queryKey: guestAccessKeys.all });
    setEmail("");
    setCode("");
    setSent(null);
    setSelected(null);
    setRequestError(null);
    setVerifyError(null);
    setResendAfter(0);
    setStep("email");
  }, [queryClient]);

  return {
    step,
    email,
    code,
    sent,
    requestError,
    verifyError,
    resendAfter,
    selected,
    records,
    pendingRequest: requestOtp.isPending,
    pendingVerify: verifyOtp.isPending,
    setEmail,
    setCode,
    setSelected,
    submitEmail,
    resend,
    submitCode,
    backToEmail,
    reset,
  };
}
