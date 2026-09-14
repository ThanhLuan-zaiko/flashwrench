// One-time bootstrap for the first admin user.
// Dev: values come from .env.local (auto-loaded by Bun).
// Prod: the same SEED_ADMIN_* names must be injected from a secrets
// manager by CI/CD. Never run automatically on server boot.
import {
  type AdminSeedConfig,
  loadAdminSeedConfig,
} from "../lib/auth/admin-seed.config";
import { seedAdmin } from "../lib/auth/admin-seed.service";
import { scylla } from "../lib/db/client";

async function main(): Promise<number> {
  let config: AdminSeedConfig;
  try {
    config = loadAdminSeedConfig();
  } catch (error) {
    console.error(
      `[seed:admin] ${error instanceof Error ? error.message : "Invalid env."}`,
    );
    return 1;
  }

  try {
    const outcome = await seedAdmin(config);
    if (outcome.status === "created") {
      console.log(
        `[seed:admin] Created admin ${outcome.user.email} (${outcome.user.id}).`,
      );
      return 0;
    }
    if (outcome.status === "exists") {
      console.log(
        `[seed:admin] Admin ${outcome.user.email} already exists, skipping.`,
      );
      return 0;
    }
    if (outcome.status === "invalid") {
      console.error(
        `[seed:admin] Invalid seed data: ${JSON.stringify(outcome.errors)}.`,
      );
      return 1;
    }
    console.error(`[seed:admin] ${outcome.message}`);
    return 1;
  } catch (error) {
    console.error(
      `[seed:admin] Unexpected failure: ${error instanceof Error ? error.message : String(error)}.`,
    );
    return 1;
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
}

async function run(): Promise<void> {
  const code = await main();
  process.exit(code);
}

await run();
