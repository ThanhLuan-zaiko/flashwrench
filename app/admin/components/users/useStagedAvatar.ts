"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  defaultMaxUploadBytes,
  sniffImageMime,
} from "@/lib/media/media.validation";
import { decideStageFiles } from "../services/cover-staging";
import type { StagedCover } from "../services/useStagedCovers";

// Single-avatar staging for one staff dialog. Dropped files become a
// local object-URL preview only; uploads run in the dialog submit.
// Existing is the kept saved URL (null after removal); staged holds at
// most one pending blob that replaces it on save.
export function useStagedAvatar(initialUrl: string | null) {
  const [existing, setExisting] = useState<string | null>(initialUrl);
  const [staged, setStaged] = useState<StagedCover | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const stagedRef = useRef<StagedCover | null>(null);
  stagedRef.current = staged;

  useEffect(() => {
    const current = stagedRef.current;
    return () => {
      if (current) URL.revokeObjectURL(current.previewUrl);
    };
  }, []);

  const total = (existing ? 1 : 0) + (staged ? 1 : 0);
  const canAddMore = !staged;

  const addFiles = useCallback(async (files: File[] | FileList) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    setError(null);
    const file = list[0] as File;
    const decision = decideStageFiles(
      [{ name: file.name, type: file.type, size: file.size }],
      stagedRef.current ? 1 : 0,
    );
    if (decision.accepted.length === 0) {
      setError(decision.rejected[0]?.reason ?? "Không thêm được ảnh nào.");
      return;
    }
    if (file.size > defaultMaxUploadBytes()) {
      setError(
        `Ảnh tối đa ${Math.round(defaultMaxUploadBytes() / 1024 / 1024)}MB.`,
      );
      return;
    }
    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch {
      setError("Không đọc được file ảnh. Vui lòng thử lại.");
      return;
    }
    if (sniffImageMime(bytes) !== file.type) {
      setError("File không phải ảnh hợp lệ.");
      return;
    }
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const next: StagedCover = {
      id,
      name: file.name,
      blob: file,
      previewUrl: URL.createObjectURL(file),
      mime: file.type,
      width: null,
      height: null,
    };
    setStaged((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return next;
    });
  }, []);

  const removeExisting = useCallback(() => {
    setExisting(null);
  }, []);

  const removeStaged = useCallback(() => {
    setStaged((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }, []);

  const applyCrop = useCallback(
    (blob: Blob, dims: { width: number; height: number }) => {
      setStaged((prev) => {
        if (!prev) return prev;
        URL.revokeObjectURL(prev.previewUrl);
        return {
          ...prev,
          blob,
          previewUrl: URL.createObjectURL(blob),
          mime: blob.type || prev.mime,
          width: dims.width,
          height: dims.height,
        };
      });
    },
    [],
  );

  return {
    existing,
    staged,
    error,
    dragging,
    setDragging,
    setError,
    total,
    canAddMore,
    addFiles,
    removeExisting,
    removeStaged,
    applyCrop,
  };
}

export type StagedAvatarApi = ReturnType<typeof useStagedAvatar>;
