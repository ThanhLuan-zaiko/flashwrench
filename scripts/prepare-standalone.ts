// Prepares `.next/standalone` before `node .next/standalone/server.js` runs.
// Usage: `bun run build` first; `bun run start` calls this automatically.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { applyStandalonePlan, standalonePlan } from "./standalone";

const root = join(import.meta.dir, "..");

if (!existsSync(join(root, ".next", "standalone", "server.js"))) {
  console.error(
    "Missing .next/standalone/server.js. Run `bun run build` first.",
  );
  process.exit(1);
}

await applyStandalonePlan(standalonePlan(root));
console.log("[start] standalone assets are ready");
