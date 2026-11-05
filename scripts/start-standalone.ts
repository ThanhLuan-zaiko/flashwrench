// Runs the production server: `bun run build` first, then `bun run start`.
// Bun loads .env.local for this script but not for the commands of a package
// script, so node must start from here to inherit the database settings.
// Variables already set by the host (systemd, Docker) still take precedence.
import { join } from "node:path";
import "./prepare-standalone";

const server = Bun.spawn(
  ["node", join(import.meta.dir, "..", ".next", "standalone", "server.js")],
  { stdin: "inherit", stdout: "inherit", stderr: "inherit" },
);

process.on("SIGINT", () => server.kill("SIGINT"));
process.on("SIGTERM", () => server.kill("SIGTERM"));

process.exit(await server.exited);
