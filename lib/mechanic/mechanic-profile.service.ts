import type { PublicUser } from "@/lib/auth/user.types";
import {
  MECHANIC_DIRECTORY_TOPIC,
  OPERATIONS_TOPIC,
  userTopic,
} from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";
import { isRecord, numericInput } from "@/lib/validation";
import type { MechanicProfileRow, MechanicResult } from "./mechanic.types";
import { syncMechanicDirectory } from "./mechanic-directory.service";
import { isValidLatitude, isValidLongitude } from "./mechanic-geo";
import {
  initMechanicProfileRow,
  updateMechanicPresence,
} from "./mechanic-profile.repository";
import { findMechanicProfileRow } from "./mechanic-workspace.repository";

export const MECHANIC_SKILLS = [
  "engine",
  "tire",
  "battery",
  "brake",
  "ac",
  "electrical",
  "diagnostics",
] as const;

const MAX_SKILLS = 7;

export type MechanicPresence = {
  online: boolean;
  available: boolean;
  verified: boolean;
  skills: string[];
  baseLat: number | null;
  baseLng: number | null;
};

export type MechanicPresenceInput = {
  online: boolean;
  skills: string[];
  baseLat: number | null;
  baseLng: number | null;
};

function fail<T>(status: number, form: string): MechanicResult<T> {
  return { ok: false, status, errors: { form } };
}

function isMechanicUser(user: PublicUser): boolean {
  return user.role === "mechanic" && user.status === "active";
}

function serverVerified(user: PublicUser): boolean {
  return user.role === "mechanic" && user.status === "active";
}

function toPresence(row: MechanicProfileRow): MechanicPresence {
  return {
    online: row.is_online === true,
    available: row.is_available === true,
    verified: row.is_verified === true,
    skills: (row.skills ?? []).map(String).filter((skill) => skill.length > 0),
    baseLat: row.base_lat,
    baseLng: row.base_lng,
  };
}

async function ensureProfile(
  user: PublicUser,
): Promise<MechanicProfileRow | null> {
  const existing = await findMechanicProfileRow(user.id);
  if (existing) return existing;
  const now = new Date();
  await initMechanicProfileRow({
    mechanicId: user.id,
    displayName: user.fullName,
    skills: [],
    baseLat: null,
    baseLng: null,
    isVerified: serverVerified(user),
    isOnline: false,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  });
  return (await findMechanicProfileRow(user.id)) ?? null;
}

export async function getMechanicPresence(
  user: PublicUser,
): Promise<MechanicResult<MechanicPresence>> {
  if (!isMechanicUser(user)) {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  const profile = await ensureProfile(user);
  if (!profile) {
    return fail(500, "Không tải được hồ sơ thợ.");
  }
  return { ok: true, data: toPresence(profile) };
}

export function validatePresenceInput(
  raw: unknown,
): { value: MechanicPresenceInput } | { errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!isRecord(raw)) {
    return { errors: { form: "Dữ liệu gửi lên không hợp lệ." } };
  }
  const body = raw;
  const online = body.online;
  if (typeof online !== "boolean") {
    errors.online = "Trạng thái trực tuyến không hợp lệ.";
  }
  const skillsRaw = body.skills;
  const skills: string[] = [];
  if (!Array.isArray(skillsRaw) || skillsRaw.length > MAX_SKILLS) {
    errors.skills = "Danh sách kỹ năng không hợp lệ.";
  } else {
    for (const skill of skillsRaw) {
      if (
        typeof skill !== "string" ||
        !MECHANIC_SKILLS.includes(skill as (typeof MECHANIC_SKILLS)[number])
      ) {
        errors.skills = "Kỹ năng không hợp lệ.";
        break;
      }
      if (!skills.includes(skill)) skills.push(skill);
    }
  }
  const hasLat = body.baseLat !== undefined && body.baseLat !== null;
  const hasLng = body.baseLng !== undefined && body.baseLng !== null;
  const baseLat = hasLat ? numericInput(body.baseLat) : null;
  const baseLng = hasLng ? numericInput(body.baseLng) : null;
  if (hasLat !== hasLng) {
    errors.location = "Cần cả vĩ độ và kinh độ điểm xuất phát.";
  } else if (
    hasLat &&
    (!isValidLatitude(baseLat) || !isValidLongitude(baseLng))
  ) {
    errors.location = "Tọa độ điểm xuất phát không hợp lệ.";
  }
  if (online === true && (!hasLat || !hasLng)) {
    errors.location = "Cần điểm xuất phát trước khi trực tuyến.";
  }
  if (Object.keys(errors).length > 0) return { errors };
  return {
    value: {
      online: online as boolean,
      skills,
      baseLat,
      baseLng,
    },
  };
}

export async function updateMechanicProfilePresence(
  user: PublicUser,
  raw: unknown,
): Promise<MechanicResult<MechanicPresence>> {
  if (!isMechanicUser(user)) {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  const checked = validatePresenceInput(raw);
  if ("errors" in checked) {
    return { ok: false, status: 400, errors: checked.errors };
  }
  const profile = await ensureProfile(user);
  if (!profile) {
    return fail(500, "Không tải được hồ sơ thợ.");
  }
  const value = checked.value;
  const now = new Date();
  await updateMechanicPresence({
    mechanicId: user.id,
    displayName: profile.display_name ?? user.fullName,
    skills: value.skills,
    baseLat: value.baseLat,
    baseLng: value.baseLng,
    isOnline: value.online,
    isVerified: serverVerified(user),
    updatedAt: now,
  });
  await syncMechanicDirectory(user.id);
  void Promise.all([
    publishRealtimeEvent(MECHANIC_DIRECTORY_TOPIC, {
      kind: "mechanic-updated",
    }),
    publishRealtimeEvent(OPERATIONS_TOPIC, { kind: "mechanic-updated" }),
    publishRealtimeEvent(userTopic(user.id), { kind: "mechanic-updated" }),
  ]);
  const refreshed = await findMechanicProfileRow(user.id);
  return { ok: true, data: toPresence(refreshed ?? profile) };
}
