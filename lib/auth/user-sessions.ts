import { listSessionsByUser } from "./refresh.repository";

export type SessionListItem = {
  familyId: string;
  deviceLabel: string;
  createdAt: string | null;
  expiresAt: string | null;
  current: boolean;
};

export function deviceLabel(userAgent: string | null): string {
  if (!userAgent) return "Thiết bị không rõ";
  const clean = userAgent.trim().slice(0, 120);
  return clean || "Thiết bị không rõ";
}

export async function listUserSessions(
  userId: string,
  currentFamilyId?: string,
): Promise<SessionListItem[]> {
  const rows = await listSessionsByUser(userId);
  return rows.map((r) => ({
    familyId: r.family_id,
    deviceLabel: r.device_label ?? "Thiết bị không rõ",
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
    expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
    current: currentFamilyId ? r.family_id === currentFamilyId : false,
  }));
}
