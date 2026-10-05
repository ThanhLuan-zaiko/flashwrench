const INVALID_SELECTOR = '[aria-invalid="true"], [role="alert"]';

type FocusTarget = {
  getAttribute(name: string): string | null;
  focus?(options?: FocusOptions): void;
  scrollIntoView?(options?: ScrollIntoViewOptions): void;
};

type FocusRoot = {
  querySelector(selector: string): FocusTarget | null;
};

// After a rejected submit, bring the first problem (DOM order) into
// view: the confirm button now sits in a pinned aside far from the
// fields, so the page has to travel to the error itself.
export function focusFirstInvalid(root: FocusRoot): boolean {
  const target = root.querySelector(INVALID_SELECTOR);
  if (!target) return false;
  target.scrollIntoView?.({ block: "center" });
  if (target.getAttribute("aria-invalid") === "true")
    target.focus?.({ preventScroll: true });
  return true;
}
