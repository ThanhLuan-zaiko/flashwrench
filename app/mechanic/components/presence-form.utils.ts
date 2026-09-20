// Pure helpers for the presence card so the online/base-point rule stays
// unit-testable. Mirrors validatePresenceInput server side: a mechanic
// cannot go online without a base coordinate pair.
export type PresenceDraft = {
  online: boolean;
  baseLat: number | null;
  baseLng: number | null;
};

export function needsBasePoint(draft: PresenceDraft): boolean {
  return draft.online && (draft.baseLat === null || draft.baseLng === null);
}

export function presenceStatusText(
  loading: boolean,
  online: boolean,
  displayName: string | null,
): string {
  if (loading) return "Đang tải trạng thái…";
  if (online) return `${displayName ?? "Bạn"} đang trực tuyến.`;
  return "Đang ngoại tuyến — bật để nhận đơn.";
}
