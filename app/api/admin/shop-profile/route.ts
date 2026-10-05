import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import { SHOP_PROFILE_TOPIC } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";
import {
  getShopProfileConfig,
  updateShopProfile,
} from "@/lib/shop/shop-profile.service";

// Admin storefront identity. GET returns the live values or the code
// defaults when never saved; PATCH validates name/hotline/address and
// returns field errors.
export async function GET() {
  const { response } = await requireRole("admin");
  if (response) return response;
  try {
    const profile = await getShopProfileConfig();
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json(
      {
        errors: {
          form: "Không tải được thông tin cửa hàng. Vui lòng thử lại.",
        },
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireRole("admin");
  if (response) return response;

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }

  try {
    const result = await updateShopProfile(user, body);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    // Fan the change out to open customer pages and other admin tabs;
    // the payload is only a refresh signal, values refetch over HTTPS.
    void publishRealtimeEvent(SHOP_PROFILE_TOPIC, {
      kind: "config-updated",
      updatedAt: result.data.profile.updatedAt,
    });
    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      {
        errors: {
          form: "Không lưu được thông tin cửa hàng. Vui lòng thử lại.",
        },
      },
      { status: 500 },
    );
  }
}
