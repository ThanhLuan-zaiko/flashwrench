export type AdminSeedConfig = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  enforceSingleAdmin: boolean;
  lookbackMonths: number;
};

function parseBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw === "") return fallback;
  return raw.toLowerCase() === "true" || raw === "1";
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

// Read bootstrap credentials from the environment. In dev Bun loads
// .env.local automatically; in prod the same names must be injected from
// a secrets manager. Never commit real values, only document names.
export function loadAdminSeedConfig(
  env: Record<string, string | undefined> = process.env,
): AdminSeedConfig {
  const phone = (env.SEED_ADMIN_PHONE ?? "").trim();
  const email = (env.SEED_ADMIN_EMAIL ?? "").trim();
  const password = env.SEED_ADMIN_PASSWORD ?? "";
  const fullName = (env.SEED_ADMIN_FULL_NAME ?? "Site Administrator").trim();

  const missing: string[] = [];
  if (!phone) missing.push("SEED_ADMIN_PHONE");
  if (!email) missing.push("SEED_ADMIN_EMAIL");
  if (!password) missing.push("SEED_ADMIN_PASSWORD");
  if (missing.length > 0) {
    throw new Error(
      `Missing required admin seed env vars: ${missing.join(", ")}.`,
    );
  }

  return {
    fullName: fullName || "Site Administrator",
    phone,
    email,
    password,
    enforceSingleAdmin: parseBoolean(env.SEED_ADMIN_ENFORCE_SINGLE_ADMIN, true),
    lookbackMonths: parsePositiveInt(env.SEED_ADMIN_LOOKBACK_MONTHS, 12),
  };
}
