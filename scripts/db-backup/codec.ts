// Lossless JSON codec for cassandra-driver values.
// Driver types (uuid, bigint, varint, decimal, date, time, inet, blob,
// timestamp, duration, tuple, map, set) are wrapped in single-key "$tag"
// objects so a restore rebuilds exactly the same CQL value.
import { types } from "cassandra-driver";

export type Encoded =
  | null
  | boolean
  | number
  | string
  | Encoded[]
  | { [key: string]: Encoded };

export function encodeValue(value: unknown): Encoded {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean" || typeof value === "string") return value;
  if (typeof value === "number") {
    if (Number.isFinite(value)) return value;
    return { $num: String(value) };
  }
  if (value instanceof types.Uuid) return { $uuid: value.toString() };
  if (value instanceof types.Long) return { $long: value.toString() };
  if (value instanceof types.BigDecimal) return { $dec: value.toString() };
  if (value instanceof types.Integer) return { $varint: value.toString() };
  if (value instanceof types.LocalDate) return { $date: value.toString() };
  if (value instanceof types.LocalTime) return { $time: value.toString() };
  if (value instanceof types.InetAddress) return { $inet: value.toString() };
  if (value instanceof types.Duration) return { $dur: value.toString() };
  if (value instanceof types.Tuple) {
    return { $tuple: value.values().map(encodeValue) };
  }
  if (value instanceof Date) return { $ts: value.toISOString() };
  if (Buffer.isBuffer(value)) return { $blob: value.toString("base64") };
  if (value instanceof Map) {
    return {
      $map: [...value.entries()].map(([k, v]) => [
        encodeValue(k),
        encodeValue(v),
      ]),
    };
  }
  if (value instanceof Set) return { $set: [...value].map(encodeValue) };
  if (Array.isArray(value)) return value.map(encodeValue);
  if (typeof value === "object") {
    // UDT: plain object keyed by field name.
    const out: { [key: string]: Encoded } = {};
    for (const [k, v] of Object.entries(value)) out[k] = encodeValue(v);
    return { $udt: out };
  }
  throw new Error(`Unsupported value type: ${typeof value}`);
}

function tagOf(value: { [key: string]: Encoded }): [string, Encoded] | null {
  const keys = Object.keys(value);
  if (keys.length !== 1 || !keys[0].startsWith("$")) return null;
  return [keys[0], value[keys[0]]];
}

export function decodeValue(value: Encoded): unknown {
  if (value === null) return undefined; // unset: no tombstone on insert
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(decodeValue);
  const tagged = tagOf(value);
  if (!tagged) throw new Error("Malformed backup value");
  const [tag, raw] = tagged;
  const s = String(raw);
  switch (tag) {
    case "$num":
      return Number(s);
    case "$uuid":
      return types.Uuid.fromString(s);
    case "$long":
      return types.Long.fromString(s);
    case "$dec":
      return types.BigDecimal.fromString(s);
    case "$varint":
      return types.Integer.fromString(s);
    case "$date":
      return types.LocalDate.fromString(s);
    case "$time":
      return types.LocalTime.fromString(s);
    case "$inet":
      return types.InetAddress.fromString(s);
    case "$dur":
      return types.Duration.fromString(s);
    case "$ts":
      return new Date(s);
    case "$blob":
      return Buffer.from(s, "base64");
    case "$tuple":
      return types.Tuple.fromArray((raw as Encoded[]).map(decodeValue));
    case "$map":
      return new Map(
        (raw as Encoded[][]).map(([k, v]) => [decodeValue(k), decodeValue(v)]),
      );
    case "$set":
      return new Set((raw as Encoded[]).map(decodeValue));
    case "$udt": {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(raw as { [key: string]: Encoded })) {
        const decoded = decodeValue(v);
        out[k] = decoded === undefined ? null : decoded;
      }
      return out;
    }
    default:
      throw new Error(`Unknown backup tag ${tag}`);
  }
}
