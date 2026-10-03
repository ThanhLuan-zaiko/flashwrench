"use client";

import { useState } from "react";
import { useSendChatMessage } from "@/hooks/chat";
import { formatChatLocation } from "@/lib/chat/chat-content";
import { uploadChatImage } from "@/services/chat.api";
import { MediaApiError } from "@/services/media.api";

const IMAGE_MIME_ALLOWLIST = ["image/jpeg", "image/png", "image/webp"];

// Image sender: upload first (no optimistic row for a pending upload),
// then send the asset URL as an image message through the shared mutation
// so cache reconciliation stays in one place.
export function useSendChatImage(threadId: string) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const send = useSendChatMessage(threadId);

  async function sendImage(file: File | null): Promise<void> {
    if (!file || uploading || send.isPending) return;
    if (!IMAGE_MIME_ALLOWLIST.includes(file.type)) {
      setError("Chỉ nhận ảnh JPEG, PNG hoặc WebP.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const url = await uploadChatImage(threadId, file);
      await send.mutateAsync({ body: url, kind: "image" });
    } catch (err) {
      setError(
        err instanceof MediaApiError
          ? (err.errors.file ?? err.errors.form ?? "Tải ảnh lên thất bại.")
          : "Tải ảnh lên thất bại. Thử lại sau.",
      );
    } finally {
      setUploading(false);
    }
  }

  return { sendImage, uploading, error };
}

// Location sender: one high-accuracy GPS fix, stored as "lat,lng".
export function useSendChatLocation(threadId: string) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const send = useSendChatMessage(threadId);

  function sendLocation(): void {
    if (locating || send.isPending) return;
    if (!("geolocation" in navigator)) {
      setError("Thiết bị không hỗ trợ định vị.");
      return;
    }
    setError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        send.mutate(
          {
            body: formatChatLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }),
            kind: "location",
          },
          { onError: (err) => setError(err.message) },
        );
      },
      () => {
        setLocating(false);
        setError("Không lấy được vị trí hiện tại. Kiểm tra quyền định vị.");
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  }

  return { sendLocation, locating, error };
}
