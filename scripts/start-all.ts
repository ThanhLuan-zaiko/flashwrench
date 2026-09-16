// Run the production Next.js server and the realtime gateway together.
// Usage: `bun run build` first, then `bun run start:all`.
// Forwards SIGINT/SIGTERM to both children.
//
// Production parity on purpose: this serves the last build output with NO
// file watching, so editing source does nothing until the next `bun run
// build`. Instant updates belong to `bun run dev:all`; rebuilding on every
// change would cost a full production build per edit plus restart downtime.
import { runChildren, startChildren } from "./proc-config";

await runChildren(startChildren());
