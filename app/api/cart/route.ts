import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import { addToCart, clearCart, getCartView } from "@/lib/orders/cart.service";

// Customer cart. Only the customer role holds a cart; staff accounts never
// buy parts through the shop flow.
export async function GET() {
  const { user, response } = await requireRole("customer");
  if (response) return response;
  try {
    const result = await getCartView(user.id);
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    return NextResponse.json({ cart: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được giỏ hàng. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const { user, response } = await requireRole("customer");
  if (response) return response;
  const origin = mutationOriginError(request);
  if (origin) return origin;
  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result = await addToCart(
      user.id,
      String(body.partId ?? ""),
      body.qty,
    );
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    return NextResponse.json({ cart: result.data });
  } catch {
    return NextResponse.json(
      {
        errors: {
          form: "Không thêm được vào giỏ hàng. Vui lòng thử lại sau.",
        },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const { user, response } = await requireRole("customer");
  if (response) return response;
  const origin = mutationOriginError(request);
  if (origin) return origin;
  try {
    const result = await clearCart(user.id);
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    return NextResponse.json({ cart: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không xóa được giỏ hàng. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
