"use client";

import { CommentSection } from "@/components/feedback/CommentSection";

// Staff side of a complaint discussion: the same comment thread the
// customer sees under /history/complaints (admin role is enforced
// server-side on the comments API).
export function ComplaintThread({ complaintId }: { complaintId: string }) {
  return (
    <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
      <CommentSection
        targetType="complaint"
        targetId={complaintId}
        title="Trao đổi với khách hàng"
      />
    </div>
  );
}
