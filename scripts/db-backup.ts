// Full logical backup of the ScyllaDB keyspace named in .env.local.
// Writes schema + every row to a gzipped JSON Lines file at the repo root
// (db-backup-<timestamp>.jsonl.gz, git-ignored). Restore it on any machine
// with scripts/db-restore.ts.
// Usage: bun run db:backup [output-file]
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { encodeValue } from "./db-backup/codec";
import { createClient, q, readSchema } from "./db-backup/schema";

export const BACKUP_VERSION = 1;

async function main(): Promise<void> {
  const keyspace = process.env.SCYLLA_KEYSPACE;
  if (!keyspace) throw new Error("SCYLLA_KEYSPACE is missing in .env.local");

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const out = resolve(
    process.argv[2] ?? `db-backup-${keyspace}-${stamp}.jsonl.gz`,
  );

  const client = createClient();
  await client.connect();
  try {
    const schema = await readSchema(client, keyspace);
    if (schema.tables.length === 0) {
      throw new Error(`Keyspace "${keyspace}" has no tables`);
    }
    if (schema.views.length > 0) {
      console.warn(
        `Materialized views are not backed up: ${schema.views.join(", ")}`,
      );
    }

    const lines: string[] = [
      JSON.stringify({
        kind: "meta",
        version: BACKUP_VERSION,
        keyspace,
        createdAt: new Date().toISOString(),
        schema,
      }),
    ];

    let total = 0;
    for (const table of schema.tables) {
      const names = table.columns.map((c) => c.name);
      const cql = `SELECT ${names.map(q).join(", ")} FROM ${q(keyspace)}.${q(table.name)}`;
      let count = 0;
      let pageState: string | undefined;
      do {
        const page = await client.execute(cql, [], {
          prepare: true,
          fetchSize: 1000,
          pageState,
        });
        for (const row of page.rows) {
          const r: Record<string, unknown> = {};
          for (const name of names) {
            const value = row[name];
            if (value !== null && value !== undefined)
              r[name] = encodeValue(value);
          }
          lines.push(JSON.stringify({ kind: "row", t: table.name, r }));
          count++;
        }
        pageState = page.pageState ?? undefined;
      } while (pageState);
      total += count;
      console.log(`  ${table.name}: ${count}`);
    }

    writeFileSync(
      out,
      Bun.gzipSync(new TextEncoder().encode(`${lines.join("\n")}\n`)),
    );
    console.log(
      `Backed up ${schema.tables.length} tables, ${total} rows -> ${out}`,
    );
  } finally {
    await client.shutdown();
  }
}

main().catch((error) => {
  console.error(
    "Backup failed:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
