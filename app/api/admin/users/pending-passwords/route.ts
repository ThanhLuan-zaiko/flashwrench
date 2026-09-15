import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { listPendingTempPasswords } from "@/lib/auth/staff-pending.service";
import { isTempCryptoConfigured } from "@/lib/auth/staff-temp-crypto";

// Decrypt pending temp passwords for exactly the ids the page shows.
// Bounded single-partition reads instead of a role-bucket scan, so the
// staff tab stays fast. Admin-only; bad rows are skipped by the service.
export async function POST(request: Request) {
  const { response } = await requireRole("admin");
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
  const userIds = (body as { userIds?: unknown }).userIds;
  if (!Array.isArray(userIds)) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }

  try {
    const items = await listPendingTempPasswords(userIds as string[]);
    return NextResponse.json({
      items,
      cryptoConfigured: isTempCryptoConfigured(),
    });
  } catch {
    return NextResponse.json(
      {
        errors: {
          form: "Không tải được mật khẩu tạm. Vui lòng thử lại sau.",
        },
      },
      { status: 500 },
    );
  }
}
