import { Client } from "cassandra-driver";

declare global {
  // eslint-disable-next-line no-var
  var scyllaClient: Client | undefined;
}

function createClient(): Client {
  const contactPoints = (process.env.SCYLLA_CONTACT_POINTS ?? "127.0.0.1").split(",");
  const port = Number(process.env.SCYLLA_PORT) || 9042;

  return new Client({
    contactPoints,
    protocolOptions: { port },
    localDataCenter: process.env.SCYLLA_LOCAL_DATACENTER ?? "datacenter1",
    keyspace: process.env.SCYLLA_KEYSPACE || undefined,
    socketOptions: {
      connectTimeout: 10_000,
      readTimeout: 10_000,
    },
  });
}

export const scylla = globalThis.scyllaClient ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.scyllaClient = scylla;
}