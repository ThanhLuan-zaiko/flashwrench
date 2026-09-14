#!/usr/bin/env bash
# Reset ONLY this project's ScyllaDB keyspace ("flashwrench").
# Safe on shared clusters: it DROPs just one keyspace, then recreates it
# from schema.cql. It never touches other keyspaces, containers or volumes.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Load dev env if present (contact points / port / container name).
set -a; [ -f "$SCRIPT_DIR/.env.local" ] && . "$SCRIPT_DIR/.env.local"; set +a

KEYSPACE="${SCYLLA_KEYSPACE:-flashwrench}"
HOST="${SCYLLA_CONTACT_POINTS:-127.0.0.1}"
PORT="${SCYLLA_PORT:-9042}"
CONTAINER="${SCYLLA_CONTAINER:-scylladb}"
SCHEMA="$SCRIPT_DIR/schema.cql"

# --- Safety guards: never allow empty / system keyspaces --------------------
case "$KEYSPACE" in
  ""|system|system_schema|system_distributed|system_traces|system_auth) echo "Refusing to reset reserved keyspace: '$KEYSPACE'" >&2; exit 1;;
esac
[[ "$KEYSPACE" =~ ^[a-z][a-z0-9_]{2,48}$ ]] || { echo "Invalid keyspace name: '$KEYSPACE'" >&2; exit 1; }
[ -f "$SCHEMA" ] || { echo "Schema file not found: $SCHEMA" >&2; exit 1; }

if [[ "${1:-}" != "--yes" && "${1:-}" != "-y" ]]; then
  read -rp "Drop and recreate keyspace \"$KEYSPACE\" on $HOST:$PORT? [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }
fi

if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$CONTAINER"; then
  echo "-> Resetting keyspace \"$KEYSPACE\" via container \"$CONTAINER\"..."
  docker exec -i "$CONTAINER" cqlsh -e "DROP KEYSPACE IF EXISTS \"$KEYSPACE\";"
  docker cp "$SCHEMA" "$CONTAINER:/tmp/flashwrench_schema.cql"
  docker exec -i "$CONTAINER" cqlsh -f /tmp/flashwrench_schema.cql
elif command -v cqlsh >/dev/null 2>&1; then
  echo "-> Resetting keyspace \"$KEYSPACE\" via local cqlsh ($HOST:$PORT)..."
  cqlsh "$HOST" "$PORT" -e "DROP KEYSPACE IF EXISTS \"$KEYSPACE\";"
  cqlsh "$HOST" "$PORT" -f "$SCHEMA"
else
  echo "No running container '$CONTAINER' and no local cqlsh found." >&2; exit 1
fi

echo "Done. Keyspace \"$KEYSPACE\" was dropped and recreated; all other keyspaces untouched."
