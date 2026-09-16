import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import { createMediaAsset } from "@/lib/media/media.service";

// Image upload (multipart/form-data): file + scope + ownerType +
// ownerId + optional alt/width/height. Thin handler: parse, call the
// service, shape the response. Never fs or CQL here.
export async function POST(request: Request) {
  const { response, user } = await requireAuth();
  if (response) return response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { errors: { file: "Vui lòng chọn file ảnh để tải lên." } },
      { status: 400 },
    );
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await createMediaAsset(user, {
      ownerType: form.get("ownerType"),
      ownerId: form.get("ownerId"),
      scope: form.get("scope"),
      file: bytes,
      mime: file.type,
      width: form.get("width"),
      height: form.get("height"),
      alt: form.get("alt"),
    });

    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ asset: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được ảnh. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
