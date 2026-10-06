import type { PaymentPromptItem } from "@/lib/payments/payment-prompt.types";
import { apiRequest } from "./auth.api";

// Pending cash collections for the signed-in customer — feeds the global
// payment banner under the site header.
export function fetchPaymentPrompts(): Promise<{
  prompts: PaymentPromptItem[];
}> {
  return apiRequest<{ prompts: PaymentPromptItem[] }>(
    "/api/me/payment-prompts",
  );
}
