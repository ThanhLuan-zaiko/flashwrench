import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import type { ComplaintAction } from "@/lib/complaints/complaint.types";
import { transitionComplaint } from "@/lib/complaints/complaints.service";
import { COMPLAINTS_TOPIC } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ complaintId: string }> },
) {
  const { response } = await requireRole("admin");
  if (response) return response;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  const action = body.action as ComplaintAction;
  try {
    const { complaintId } = await params;
    const result = await transitionComplaint(complaintId, {
      action,
      note: body.note === undefined ? undefined : String(body.note),
    });
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    void publishRealtimeEvent(COMPLAINTS_TOPIC, {
      kind: "complaint-updated",
      complaintId,
    });
    return NextResponse.json({ complaint: result.data });
  } catch {
    return NextResponse.json(
      {
        errors: {
          form: "Không cập nhật được khiếu nại. Vui lòng thử lại sau.",
        },
      },
      { status: 500 },
    );
  }
}
