import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import { setMyAvatar } from "@/lib/media/avatar.service";

// Point my profile at an avatar-scope upload I own. Thin handler.
export async function POST(request: Request) {
  const { response, user } = await requireAuth();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }

  try {
    const result = await setMyAvatar(
      user,
      (body as { assetId?: string }).assetId ?? "",
    );
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ avatarUrl: result.data.avatarUrl });
  } catch {
    return NextResponse.json(
      {
        errors: {
          form: "Không cập nhật được ảnh đại diện. Vui lòng thử lại sau.",
        },
      },
      { status: 500 },
    );
  }
}
