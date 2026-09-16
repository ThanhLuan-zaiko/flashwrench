// Run the Next.js dev server and the realtime gateway together.
// Usage: `bun run dev:all`. Forwards SIGINT/SIGTERM to both children.
// The gateway runs with `bun --hot` so editing realtime/server.ts (or the
// modules it imports) reloads the gateway in place: web HMR plus gateway
// hot reload means code changes show up without restarting anything.
import { devChildren, runChildren } from "./proc-config";

await runChildren(devChildren());
