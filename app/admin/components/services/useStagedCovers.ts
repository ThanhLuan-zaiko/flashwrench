"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  defaultMaxUploadBytes,
  sniffImageMime,
} from "@/lib/media/media.validation";
import {
  buildGalleryPayload,
  canAddMore,
  decideStageFiles,
  MAX_COVER_IMAGES,
  moveToCover,
} from "./cover-staging";

export type StagedCover = {
  id: string;
  name: string;
  blob: Blob;
  previewUrl: string;
  mime: string;
  width: number | null;
  height: number | null;
};

// Deferred gallery state for one category dialog. Dropped files become
// local object-URL previews only; uploads happen in the dialog submit.
// Existing covers are plain URLs from the row; staged covers hold blobs.
export function useStagedCovers(initialUrls: string[]) {
  const [existing, setExisting] = useState<string[]>(initialUrls);
  const [staged, setStaged] = useState<StagedCover[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pinnedCover, setPinnedCover] = useState<{
    kind: "existing" | "staged";
    key: string;
  } | null>(null);
  const stagedRef = useRef<StagedCover[]>([]);
  stagedRef.current = staged;

  useEffect(() => {
    const current = stagedRef.current;
    return () => {
      for (const item of current) URL.revokeObjectURL(item.previewUrl);
    };
  }, []);

  const total = existing.length + staged.length;
  const full = canAddMore(existing.length, staged.length);

  const addFiles = useCallback(
    async (files: File[] | FileList) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      setError(null);
      const currentTotal = existing.length + stagedRef.current.length;
      const pickables = list.map((f) => ({
        name: f.name,
        type: f.type,
        size: f.size,
      }));
      const decision = decideStageFiles(pickables, currentTotal);
      if (decision.rejected.length > 0) {
        setError(decision.rejected[0]?.reason ?? null);
      }
      const maxBytes = defaultMaxUploadBytes();
      const next: StagedCover[] = [];
      for (let i = 0; i < list.length; i += 1) {
        const file = list[i] as File;
        const pickable = pickables[i] as {
          name: string;
          type: string;
          size: number;
        };
        if (!decision.accepted.includes(pickable)) continue;
        if (file.size > maxBytes) continue;
        let bytes: Uint8Array;
        try {
          bytes = new Uint8Array(await file.arrayBuffer());
        } catch {
          setError("Không đọc được file ảnh. Vui lòng thử lại.");
          continue;
        }
        const sniffed = sniffImageMime(bytes);
        if (!sniffed || sniffed !== file.type) {
          setError("File không phải ảnh hợp lệ.");
          continue;
        }
        const id =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        next.push({
          id,
          name: file.name,
          blob: file,
          previewUrl: URL.createObjectURL(file),
          mime: file.type,
          width: null,
          height: null,
        });
        if (
          existing.length + stagedRef.current.length + next.length >=
          MAX_COVER_IMAGES
        )
          break;
      }
      if (next.length > 0) setStaged((prev) => [...prev, ...next]);
      else if (!decision.rejected.length) setError("Không thêm được ảnh nào.");
    },
    [existing.length],
  );

  const removeExisting = useCallback((url: string) => {
    setPinnedCover((prev) =>
      prev?.kind === "existing" && prev.key === url ? null : prev,
    );
    setExisting((prev) => prev.filter((u) => u !== url));
  }, []);

  const removeStaged = useCallback((id: string) => {
    setPinnedCover((prev) =>
      prev?.kind === "staged" && prev.key === id ? null : prev,
    );
    setStaged((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  const applyCrop = useCallback(
    (id: string, blob: Blob, dims: { width: number; height: number }) => {
      setStaged((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          URL.revokeObjectURL(item.previewUrl);
          return {
            ...item,
            blob,
            previewUrl: URL.createObjectURL(blob),
            mime: blob.type || item.mime,
            width: dims.width,
            height: dims.height,
          };
        }),
      );
    },
    [],
  );

  // Cover is the gallery front. Within-group moves keep thumbnails
  // stable; cross-group picks are remembered as pinnedCover so the save
  // payload can put that URL first (existing urls stay stored order).
  const makeCover = useCallback(
    (kind: "existing" | "staged", index: number) => {
      if (kind === "existing") {
        setExisting((prev) => moveToCover(prev, index));
        const key = existing[index];
        setPinnedCover(key ? { kind, key } : null);
      } else {
        setStaged((prev) => {
          const target = prev[index];
          if (!target) return prev;
          setPinnedCover({ kind, key: target.id });
          return moveToCover(prev, index);
        });
      }
    },
    [existing],
  );

  const removeAtCombined = useCallback(
    (flatIndex: number) => {
      if (flatIndex < existing.length) {
        const url = existing[flatIndex];
        if (url) removeExisting(url);
      } else {
        const target = stagedRef.current[flatIndex - existing.length];
        if (target) removeStaged(target.id);
      }
    },
    [existing, removeExisting, removeStaged],
  );

  // Gallery order for the save request. Pinned staged covers jump ahead
  // of kept existing urls; otherwise kept urls stay first (legacy cover
  // stays stable) followed by fresh uploads in staged order.
  const buildPayload = useCallback(
    (uploaded: { id: string; url: string }[]) => {
      const byId = new Map(uploaded.map((u) => [u.id, u.url]));
      const stagedUrls = stagedRef.current
        .map((s) => byId.get(s.id))
        .filter((u): u is string => Boolean(u));
      let ordered: string[];
      if (pinnedCover?.kind === "staged") {
        const coverUrl = byId.get(pinnedCover.key);
        const rest = stagedUrls.filter((u) => u !== coverUrl);
        ordered = [...(coverUrl ? [coverUrl] : []), ...existing, ...rest];
      } else if (pinnedCover?.kind === "existing") {
        const rest = existing.filter((u) => u !== pinnedCover.key);
        ordered = [pinnedCover.key, ...rest, ...stagedUrls];
      } else {
        ordered = [...existing, ...stagedUrls];
      }
      return buildGalleryPayload([], ordered);
    },
    [existing, pinnedCover],
  );

  return {
    existing,
    staged,
    error,
    dragging,
    setDragging,
    setError,
    total,
    canAddMore: full,
    pinnedCover,
    addFiles,
    removeExisting,
    removeStaged,
    removeAtCombined,
    makeCover,
    applyCrop,
    buildPayload,
  };
}

export type StagedCoversApi = ReturnType<typeof useStagedCovers>;
