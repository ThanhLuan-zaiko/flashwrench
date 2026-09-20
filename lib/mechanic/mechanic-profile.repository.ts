import { scylla } from "@/lib/db/client";

export type MechanicProfileInitParams = {
  mechanicId: string;
  displayName: string;
  skills: string[];
  baseLat: number | null;
  baseLng: number | null;
  isVerified: boolean;
  isOnline: boolean;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type MechanicPresenceUpdateParams = {
  mechanicId: string;
  displayName: string;
  skills: string[];
  baseLat: number | null;
  baseLng: number | null;
  isOnline: boolean;
  isVerified: boolean;
  updatedAt: Date;
};

export async function initMechanicProfileRow(
  params: MechanicProfileInitParams,
): Promise<boolean> {
  const result = await scylla.execute(
    "INSERT INTO mechanics_by_id (mechanic_id, display_name, skills, base_lat, base_lng, is_verified, is_online, is_available, rating_avg, rating_count, completed_jobs, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) IF NOT EXISTS",
    [
      params.mechanicId,
      params.displayName,
      params.skills,
      params.baseLat,
      params.baseLng,
      params.isVerified,
      params.isOnline,
      params.isAvailable,
      0,
      0,
      0,
      params.createdAt,
      params.updatedAt,
    ],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row?.["[applied]"] === true;
}

export async function updateMechanicPresence(
  params: MechanicPresenceUpdateParams,
): Promise<void> {
  await scylla.execute(
    "UPDATE mechanics_by_id SET display_name = ?, skills = ?, base_lat = ?, base_lng = ?, is_online = ?, is_verified = ?, updated_at = ? WHERE mechanic_id = ?",
    [
      params.displayName,
      params.skills,
      params.baseLat,
      params.baseLng,
      params.isOnline,
      params.isVerified,
      params.updatedAt,
      params.mechanicId,
    ],
    { prepare: true },
  );
}
