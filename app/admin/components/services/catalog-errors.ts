import { AuthApiError } from "@/services/service-catalog.api";

// Shared error readers for catalog dialogs. Server returns field errors
// keyed by field plus an optional form message; fall back to the generic
// message so dialogs never render an empty alert.
export function fieldError(error: unknown, field: string): string | undefined {
  if (error instanceof AuthApiError) {
    return (error.errors as Record<string, string | undefined>)[field];
  }
  return undefined;
}

export function formError(error: unknown, fallback?: string): string | null {
  if (!error) return null;
  if (error instanceof AuthApiError) {
    const errors = error.errors as Record<string, string | undefined>;
    return errors.form ?? errors.confirm ?? error.message ?? fallback ?? null;
  }
  return fallback ?? "Đã có lỗi xảy ra. Vui lòng thử lại.";
}
