import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { listPaymentPrompts } from "@/lib/payments/payment-prompt.service";

// Pending cash collections for the signed-in customer — the payment banner
// reads this partition-wide list and refreshes it off realtime events.
export async function GET() {
  const { user, response } = await requireRole("customer");
  if (response) return response;
  try {
    const prompts = await listPaymentPrompts(user.id);
    return NextResponse.json({ prompts });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được yêu cầu thanh toán." } },
      { status: 500 },
    );
  }
}
