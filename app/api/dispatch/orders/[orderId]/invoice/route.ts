import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { getOrderInvoice } from "@/lib/orders/order-payment.service";

// Staff invoice: dispatcher and admin read the order detail plus the
// latest payment projection (method, amount, provider ref, paid time).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { response } = await requireRole("dispatcher", "admin");
  if (response) return response;
  try {
    const { orderId } = await params;
    const result = await getOrderInvoice(orderId);
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    return NextResponse.json({ invoice: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được hóa đơn. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
