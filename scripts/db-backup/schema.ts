// Reads a keyspace's schema from system_schema and rebuilds CQL DDL from it,
// so a backup can recreate types and tables on an empty machine.
import { auth, Client } from "cassandra-driver";

export type ColumnDef = {
  name: string;
  kind: string; // partition_key | clustering | regular | static
  position: number;
  order: string; // asc | desc | none
  type: string;
};
export type TableDef = {
  name: string;
  columns: ColumnDef[];
  defaultTtl: number;
};
export type TypeDef = {
  name: string;
  fieldNames: string[];
  fieldTypes: string[];
};
export type IndexDef = { name: string; table: string; target: string };
export type SchemaDef = {
  types: TypeDef[];
  tables: TableDef[];
  indexes: IndexDef[];
  views: string[];
};

export function createClient(): Client {
  const user = process.env.SCYLLA_USERNAME;
  return new Client({
    contactPoints: (process.env.SCYLLA_CONTACT_POINTS ?? "127.0.0.1").split(
      ",",
    ),
    protocolOptions: { port: Number(process.env.SCYLLA_PORT) || 9042 },
    localDataCenter: process.env.SCYLLA_LOCAL_DATACENTER ?? "datacenter1",
    authProvider: user
      ? new auth.PlainTextAuthProvider(user, process.env.SCYLLA_PASSWORD ?? "")
      : undefined,
    encoding: { map: Map, set: Set },
    socketOptions: { connectTimeout: 10_000, readTimeout: 60_000 },
  });
}

export const q = (name: string): string => `"${name.replace(/"/g, '""')}"`;

export async function readSchema(
  client: Client,
  keyspace: string,
): Promise<SchemaDef> {
  const p = { prepare: true };
  const ks = [keyspace];
  const [typeRows, tableRows, colRows, idxRows, viewRows] = await Promise.all([
    client.execute(
      "SELECT type_name, field_names, field_types FROM system_schema.types WHERE keyspace_name = ?",
      ks,
      p,
    ),
    client.execute(
      "SELECT table_name, default_time_to_live FROM system_schema.tables WHERE keyspace_name = ?",
      ks,
      p,
    ),
    client.execute(
      "SELECT table_name, column_name, kind, position, clustering_order, type FROM system_schema.columns WHERE keyspace_name = ?",
      ks,
      p,
    ),
    client.execute(
      "SELECT table_name, index_name, options FROM system_schema.indexes WHERE keyspace_name = ?",
      ks,
      p,
    ),
    client.execute(
      "SELECT view_name FROM system_schema.views WHERE keyspace_name = ?",
      ks,
      p,
    ),
  ]);
  const views = viewRows.rows.map((r) => String(r.view_name));
  // Skip Scylla-internal tables such as "<table>$paxos" (LWT state).
  const userTables = tableRows.rows.filter(
    (r) => !String(r.table_name).includes("$"),
  );
  const tables: TableDef[] = userTables.map((r) => ({
    name: String(r.table_name),
    defaultTtl: Number(r.default_time_to_live ?? 0),
    columns: colRows.rows
      .filter((c) => c.table_name === r.table_name)
      .map((c) => ({
        name: String(c.column_name),
        kind: String(c.kind),
        position: Number(c.position),
        order: String(c.clustering_order),
        type: String(c.type),
      })),
  }));
  return {
    types: typeRows.rows.map((r) => ({
      name: String(r.type_name),
      fieldNames: (r.field_names ?? []).map(String),
      fieldTypes: (r.field_types ?? []).map(String),
    })),
    tables,
    indexes: idxRows.rows
      .filter((r) => !views.includes(String(r.table_name)))
      .map((r) => {
        const opts = r.options as Map<string, string> | undefined;
        return {
          name: String(r.index_name),
          table: String(r.table_name),
          target: opts?.get("target") ?? "",
        };
      })
      .filter((i) => i.target !== ""),
    views,
  };
}

const byPos = (a: ColumnDef, b: ColumnDef) => a.position - b.position;

export function keyColumns(table: TableDef): ColumnDef[] {
  const pk = table.columns
    .filter((c) => c.kind === "partition_key")
    .sort(byPos);
  const ck = table.columns.filter((c) => c.kind === "clustering").sort(byPos);
  return [...pk, ...ck];
}

export function isCounterTable(table: TableDef): boolean {
  return table.columns.some((c) => c.type === "counter");
}

export function typeDdl(ks: string, t: TypeDef): string {
  const fields = t.fieldNames.map((n, i) => `${q(n)} ${t.fieldTypes[i]}`);
  return `CREATE TYPE IF NOT EXISTS ${q(ks)}.${q(t.name)} (${fields.join(", ")})`;
}

export function tableDdl(ks: string, t: TableDef): string {
  const pk = t.columns.filter((c) => c.kind === "partition_key").sort(byPos);
  const ck = t.columns.filter((c) => c.kind === "clustering").sort(byPos);
  const cols = t.columns.map(
    (c) => `${q(c.name)} ${c.type}${c.kind === "static" ? " STATIC" : ""}`,
  );
  const key = [
    `(${pk.map((c) => q(c.name)).join(", ")})`,
    ...ck.map((c) => q(c.name)),
  ];
  const opts: string[] = [];
  if (ck.length > 0) {
    const order = ck.map(
      (c) => `${q(c.name)} ${c.order === "desc" ? "DESC" : "ASC"}`,
    );
    opts.push(`CLUSTERING ORDER BY (${order.join(", ")})`);
  }
  if (t.defaultTtl > 0) opts.push(`default_time_to_live = ${t.defaultTtl}`);
  const withClause = opts.length > 0 ? ` WITH ${opts.join(" AND ")}` : "";
  return `CREATE TABLE IF NOT EXISTS ${q(ks)}.${q(t.name)} (${cols.join(", ")}, PRIMARY KEY (${key.join(", ")}))${withClause}`;
}

export function indexDdl(ks: string, i: IndexDef): string {
  return `CREATE INDEX IF NOT EXISTS ${q(i.name)} ON ${q(ks)}.${q(i.table)} (${i.target})`;
}
