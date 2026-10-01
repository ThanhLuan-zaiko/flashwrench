import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import { markThreadRead } from "@/lib/chat/chat-messages.service";

type RouteContext = { params: Promise<{ threadId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { user, response } = await requireAuth();
  if (response || !user) return response;
  const { threadId } = await context.params;
  try {
    const result = await markThreadRead(user, threadId);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      { errors: { form: "Không cập nhật được trạng thái đã đọc." } },
      { status: 500 },
    );
  }
}
