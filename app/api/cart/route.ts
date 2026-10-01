import { NextResponse } from "next/server";
import { GUEST_CART_TTL_SECONDS } from "@/lib/auth/guest-session";
import {
  attachGuestCookie,
  resolveShopper,
  type Shopper,
} from "@/lib/auth/shopper";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import { addToCart, clearCart, getCartView } from "@/lib/orders/cart.service";

const EMPTY_CART = { items: [], subtotal: 0, itemCount: 0 };

function staffForbidden(): NextResponse {
  return NextResponse.json(
    { errors: { form: "Bạn không có quyền thực hiện thao tác này." } },
    { status: 403 },
  );
}

// Shared guard: customers shop under their account id, guests under the
// fw_gid token partition. Staff accounts never buy through the shop flow.
function shopperOrForbidden(
  shopper: Shopper,
): { cartId: string } | NextResponse {
  if (shopper.user && shopper.user.role !== "customer") {
    return staffForbidden();
  }
  if (!shopper.cartId) {
    return staffForbidden();
  }
  return { cartId: shopper.cartId };
}

function cartTtl(shopper: Shopper): number | undefined {
  return shopper.user ? undefined : GUEST_CART_TTL_SECONDS;
}

export async function GET() {
  const shopper = await resolveShopper();
  // Anonymous visitors have no cart partition yet — render an empty cart
  // instead of minting a token on a read or hard-failing the badge.
  if (!shopper.cartId) {
    if (shopper.user) return staffForbidden();
    return NextResponse.json({ cart: EMPTY_CART });
  }
  try {
    const result = await getCartView(shopper.cartId);
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
  const shopper = await resolveShopper({ createGuest: true });
  const guard = shopperOrForbidden(shopper);
  if (guard instanceof NextResponse) return guard;
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
      guard.cartId,
      String(body.partId ?? ""),
      body.qty,
      cartTtl(shopper),
    );
    if (!result.ok)
      return attachGuestCookie(
        NextResponse.json({ errors: result.errors }, { status: result.status }),
        shopper,
      );
    return attachGuestCookie(NextResponse.json({ cart: result.data }), shopper);
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
  const shopper = await resolveShopper();
  const origin = mutationOriginError(request);
  if (origin) return origin;
  // Clearing a cart that was never minted is a no-op success.
  if (!shopper.cartId) {
    if (shopper.user) return staffForbidden();
    return NextResponse.json({ cart: EMPTY_CART });
  }
  try {
    const result = await clearCart(shopper.cartId);
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
