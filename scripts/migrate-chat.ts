// Non-destructive schema migration for the internal customer<->mechanic
// chat. Adds thread + inbox + message tables without touching existing
// data. Safe to re-run: existing tables are skipped.
// Usage: bun run scripts/migrate-chat.ts
import { scylla } from "../lib/db/client";

type Statement = { label: string; cql: string };

const STATEMENTS: Statement[] = [
  {
    label: "chat_threads_by_id",
    cql: `CREATE TABLE IF NOT EXISTS chat_threads_by_id (
      thread_id            uuid PRIMARY KEY,
      customer_id          uuid,
      mechanic_id          uuid,
      created_at           timestamp,
      last_message_at      timestamp,
      last_message_preview text,
      last_message_sender  uuid
    )`,
  },
  {
    label: "chat_threads_by_pair",
    cql: `CREATE TABLE IF NOT EXISTS chat_threads_by_pair (
      customer_id uuid,
      mechanic_id uuid,
      thread_id   uuid,
      PRIMARY KEY ((customer_id), mechanic_id)
    )`,
  },
  {
    label: "chat_threads_by_user",
    cql: `CREATE TABLE IF NOT EXISTS chat_threads_by_user (
      user_id              uuid,
      thread_id            uuid,
      peer_id              uuid,
      peer_name            text,
      peer_role            text,
      peer_avatar_url      text,
      last_message_at      timestamp,
      last_message_preview text,
      last_message_sender  uuid,
      last_read_at         timestamp,
      created_at           timestamp,
      PRIMARY KEY ((user_id), thread_id)
    )`,
  },
  {
    label: "chat_messages_by_thread",
    cql: `CREATE TABLE IF NOT EXISTS chat_messages_by_thread (
      thread_id  uuid,
      created_at timestamp,
      message_id uuid,
      sender_id  uuid,
      kind       text,
      body       text,
      PRIMARY KEY ((thread_id), created_at, message_id)
    ) WITH CLUSTERING ORDER BY (created_at DESC, message_id ASC)`,
  },
];

function isAlreadyApplied(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /already exists|conflicts with|duplicate|Invalid column/i.test(
    message,
  );
}

async function main(): Promise<number> {
  const keyspace = process.env.SCYLLA_KEYSPACE ?? "flashwrench";
  console.log(
    `[migrate:chat] Applying ${STATEMENTS.length} statements to "${keyspace}"...`,
  );
  let applied = 0;
  let skipped = 0;
  try {
    await scylla.connect();
    for (const statement of STATEMENTS) {
      try {
        await scylla.execute(statement.cql, [], { prepare: false });
        applied += 1;
        console.log(`  + ${statement.label}: applied`);
      } catch (error) {
        if (isAlreadyApplied(error)) {
          skipped += 1;
          console.log(`  = ${statement.label}: already present, skipped`);
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error(
      `[migrate:chat] Failed: ${error instanceof Error ? error.message : error}`,
    );
    return 1;
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
  console.log(
    `[migrate:chat] Done — ${applied} applied, ${skipped} skipped. No data touched.`,
  );
  return 0;
}

process.exit(await main());
