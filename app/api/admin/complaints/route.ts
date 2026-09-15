import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import type {
  ComplaintRefType,
  CreateComplaintInput,
} from "@/lib/complaints/complaint.types";
import {
  createComplaint,
  listComplaints,
} from "@/lib/complaints/complaints.service";

function toCreateInput(body: Record<string, unknown>): CreateComplaintInput {
  return {
    reporterName: String(body.reporterName ?? ""),
    reporterPhone:
      body.reporterPhone === undefined ? undefined : String(body.reporterPhone),
    targetUserId:
      body.targetUserId === undefined ? undefined : String(body.targetUserId),
    targetName:
      body.targetName === undefined ? undefined : String(body.targetName),
    refType:
      body.refType === undefined
        ? undefined
        : (String(body.refType) as ComplaintRefType),
    refId: body.refId === undefined ? undefined : String(body.refId),
    subject: String(body.subject ?? ""),
    body: String(body.body ?? ""),
  };
}

export async function GET(request: Request) {
  const { response } = await requireRole("admin");
  if (response) return response;
  const params = new URL(request.url).searchParams;
  try {
    const result = await listComplaints({
      status: (params.get("status") ?? undefined) as
        | "open"
        | "in_review"
        | "resolved"
        | "rejected"
        | undefined,
    });
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    return NextResponse.json({ complaints: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được khiếu nại. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}

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
  try {
    const result = await createComplaint(
      toCreateInput((body ?? {}) as Record<string, unknown>),
    );
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    return NextResponse.json({ complaint: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        errors: {
          form: "Không ghi nhận được khiếu nại. Vui lòng thử lại sau.",
        },
      },
      { status: 500 },
    );
  }
}
