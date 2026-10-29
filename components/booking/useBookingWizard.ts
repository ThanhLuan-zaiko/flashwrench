"use client";

import { type RefObject, useEffect, useState } from "react";
import { focusFirstInvalid } from "./focus-first-invalid";

const INVALID_SELECTOR = '[aria-invalid="true"], [role="alert"]';
const STEP_ATTRIBUTE = "data-booking-step";

type StepOwner = { getAttribute(name: string): string | null };
type InvalidTarget = { closest(selector: string): StepOwner | null };
type InvalidRoot = { querySelector(selector: string): InvalidTarget | null };

// Keeps a requested step inside 0..count-1.
export function clampStep(next: number, count: number): number {
  if (count <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.trunc(next)));
}

// Step that holds the first flagged field (DOM order). Problems outside
// every step wrapper (the summary aside: voucher, form-level errors)
// belong to the last step, where the summary is shown on phones.
export function stepOfFirstInvalid(
  root: InvalidRoot,
  count: number,
): number | null {
  const target = root.querySelector(INVALID_SELECTOR);
  if (!target) return null;
  const owner = target.closest(`[${STEP_ATTRIBUTE}]`);
  const index = Number(owner?.getAttribute(STEP_ATTRIBUTE));
  return Number.isInteger(index) ? clampStep(index, count) : count - 1;
}

// One-step-at-a-time navigation for the booking form on phones and
// tablets (desktop keeps every step visible). Every step stays mounted, so
// typed values and validation survive moving back and forth; a rejected
// submit jumps to the step that owns the first problem and focuses it.
export function useBookingWizard(
  count: number,
  formRef: RefObject<HTMLFormElement | null>,
  invalidAttempt: number,
) {
  const [step, setStep] = useState(0);
  const [focusRequest, setFocusRequest] = useState(0);

  const goTo = (next: number) => {
    setStep(clampStep(next, count));
    formRef.current?.scrollIntoView({ block: "start" });
  };

  useEffect(() => {
    const form = formRef.current;
    if (invalidAttempt === 0 || !form) return;
    const owner = stepOfFirstInvalid(form, count);
    if (owner === null) return;
    setStep(owner);
    setFocusRequest((value) => value + 1);
  }, [invalidAttempt, count, formRef]);

  // Runs after the owning step is visible again, so focus can land.
  useEffect(() => {
    if (focusRequest > 0 && formRef.current) focusFirstInvalid(formRef.current);
  }, [focusRequest, formRef]);

  return {
    step,
    isFirst: step === 0,
    isLast: step === count - 1,
    goTo,
    next: () => goTo(step + 1),
    prev: () => goTo(step - 1),
  };
}
