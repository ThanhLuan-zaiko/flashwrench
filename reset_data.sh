#!/usr/bin/env bash
# Reset ONLY this project's ScyllaDB keyspace ("flashwrench").
# Safe on shared clusters: it DROPs just one keyspace, then recreates it
# from schema.cql. It never touches other keyspaces, containers or volumes.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Load dev env if present (contact points / port / container name).
# Safe loader: parse KEY=VALUE line by line instead of sourcing, so values
# with spaces or Vietnamese text (e.g. SEED_ADMIN_FULL_NAME) cannot be
# executed as commands. Only valid identifiers are exported, no eval.
load_env_file() {
  local env_file="$1"
  [ -f "$env_file" ] || return 0
  local line key value quote
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"
    line="${line#"${line%%[![:space:]]*}"}"
    [ -z "$line" ] && continue
    case "$line" in \#*) continue ;; esac
    case "$line" in export\ *) line="${line#export }" ;; esac
    line="${line#"${line%%[![:space:]]*}"}"
    case "$line" in *=*) ;; *) continue ;; esac
    key="${line%%=*}"
    value="${line#*=}"
    key="${key%"${key##*[![:space:]]}"}"
    key="${key#"${key%%[![:space:]]*}"}"
    case "$key" in '' | *[!A-Za-z0-9_]* | [0-9]*) continue ;; esac
    quote="${value%"${value#?}"}"
    if [ "$quote" = '"' ] || [ "$quote" = "'" ]; then
      case "$value" in
        "\"*\"") value="${value#\"}"; value="${value%\"}" ;;
        "'*'") value="${value#\'}"; value="${value%\'}" ;;
        *)
          value="${value#"${value%%[![:space:]]*}"}"
          value="${value%"${value##*[![:space:]]}"}"
          ;;
      esac
    else
      value="${value#"${value%%[![:space:]]*}"}"
      value="${value%"${value##*[![:space:]]}"}"
    fi
    export "$key=$value"
  done <"$env_file"
}
load_env_file "$SCRIPT_DIR/.env.local"

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
