import { scylla } from "./client";

export async function checkScyllaConnection(): Promise<void> {
  // Skip checks during Docker build / CI
  if (process.env.SCYLLA_SKIP_CONNECTION_CHECK === "true") {
    console.log(
      "⏭  [ScyllaDB] Skipping connection check (SCYLLA_SKIP_CONNECTION_CHECK=true)",
    );
    return;
  }

  const target = `${process.env.SCYLLA_CONTACT_POINTS ?? "127.0.0.1"}:${process.env.SCYLLA_PORT ?? 9042}`;

  try {
    console.log(`⏳ [ScyllaDB] Connecting to ${target} ...`);
    await scylla.connect();

    const result = await scylla.execute(
      "SELECT release_version FROM system.local",
    );
    const version = result.rows[0]?.release_version;

    console.log(`   |ScyllaDB] Connection successful!`);
    console.log(`   ├─ Version : ${version}`);
    console.log(`   ├─ Hosts   : ${scylla.hosts.length}`);
    console.log(`   └─ Target  : ${target}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`   |ScyllaDB] Connection failed!`);
    console.error(`   ├─ Target : ${target}`);
    console.error(`   ├─ Error    : ${message}`);
    console.error(`   └─ Suggestions  :`);
    console.error(`      1. Container running? → docker ps`);
    console.error(`      2. ScyllaDB ready?   → docker logs scylladb`);
    console.error(`      3. Port occupied?       → lsof -i :9042`);
  }
}
