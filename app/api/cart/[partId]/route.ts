import { NextResponse } from "next/server";
import { GUEST_CART_TTL_SECONDS } from "@/lib/auth/guest-session";
import { resolveShopper, staleSessionResponse } from "@/lib/auth/shopper";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import { removeCartItem, updateCartItemQty } from "@/lib/orders/cart.service";

function staffForbidden(): NextResponse {
  return NextResponse.json(
    { errors: { form: "Bạn không có quyền thực hiện thao tác này." } },
    { status: 403 },
  );
}

function noCart(): NextResponse {
  return NextResponse.json(
    { errors: { partId: "Sản phẩm không có trong giỏ." } },
    { status: 404 },
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ partId: string }> },
) {
  const shopper = await resolveShopper();
  if (shopper.staleAccessToken) return staleSessionResponse();
  if (shopper.user && shopper.user.role !== "customer") {
    return staffForbidden();
  }
  if (!shopper.cartId) return noCart();
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
    const result = await updateCartItemQty(
      shopper.cartId,
      partId,
      body.qty,
      shopper.user ? undefined : GUEST_CART_TTL_SECONDS,
    );
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
  const shopper = await resolveShopper();
  if (shopper.staleAccessToken) return staleSessionResponse();
  if (shopper.user && shopper.user.role !== "customer") {
    return staffForbidden();
  }
  if (!shopper.cartId) return noCart();
  const origin = mutationOriginError(request);
  if (origin) return origin;
  try {
    const { partId } = await params;
    const result = await removeCartItem(shopper.cartId, partId);
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
