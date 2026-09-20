import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import { removeCartItem, updateCartItemQty } from "@/lib/orders/cart.service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ partId: string }> },
) {
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
    const { partId } = await params;
    const result = await updateCartItemQty(user.id, partId, body.qty);
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    return NextResponse.json({ cart: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không cập nhật được giỏ hàng. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ partId: string }> },
) {
  const { user, response } = await requireRole("customer");
  if (response) return response;
  const origin = mutationOriginError(request);
  if (origin) return origin;
  try {
    const { partId } = await params;
    const result = await removeCartItem(user.id, partId);
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    return NextResponse.json({ cart: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không xóa được sản phẩm. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
