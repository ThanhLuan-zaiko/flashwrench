// The only place touching node:fs for uploaded images. Everything
// else (routes, services) goes through these three calls plus the
// pure helpers in media-paths.ts, so tests mock this module instead
// of the disk.
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { absoluteAssetPath, isSafeAssetKey } from "./media-paths";

export async function writeAssetFile(key: string, data: Buffer): Promise<void> {
  if (!isSafeAssetKey(key)) throw new Error("Unsafe asset key.");
  const absolute = absoluteAssetPath(key);
  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, data);
}

export async function readAssetFile(key: string): Promise<Buffer> {
  if (!isSafeAssetKey(key)) throw new Error("Unsafe asset key.");
  return readFile(absoluteAssetPath(key));
}

export async function deleteAssetFile(key: string): Promise<void> {
  if (!isSafeAssetKey(key)) throw new Error("Unsafe asset key.");
  try {
    await unlink(absoluteAssetPath(key));
  } catch (error) {
    // Already gone (manual cleanup, double delete): not a failure.
    if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") throw error;
  }
}
