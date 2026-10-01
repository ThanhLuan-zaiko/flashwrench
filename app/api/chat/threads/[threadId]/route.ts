import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import { getThread } from "@/lib/chat/chat.service";

type RouteContext = { params: Promise<{ threadId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { user, response } = await requireAuth();
  if (response || !user) return response;
  const { threadId } = await context.params;
  try {
    const result = await getThread(user, threadId);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được cuộc trò chuyện. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
