"use client";

import { FiLoader, FiUser } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import { useMe } from "@/hooks/auth";
import { useSetAvatar } from "@/hooks/media";
import { MediaApiError } from "@/services/media.api";
import { ImageUploader } from "./ImageUploader";

function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}

// Profile avatar block for /account: current photo (or initials),
// upload with full-resolution crop, then point the profile at it.
// Renders nothing for guests; AccountPanel owns that state.
export function AvatarSection() {
  const toast = useToast();
  const me = useMe();
  const setAvatar = useSetAvatar();

  if (me.isPending) {
    return (
      <output
        aria-label="Đang tải ảnh đại diện"
        className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500 md:p-5 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
      >
        <FiLoader
          aria-hidden="true"
          className="h-4 w-4 motion-safe:animate-spin"
        />
        Đang tải ảnh đại diện…
      </output>
    );
  }
  if (!me.data) return null;

  const user = me.data;
  const saving = setAvatar.isPending;

  function handleUploaded(asset: { assetId: string }) {
    setAvatar.mutate(asset.assetId, {
      onSuccess: () => {
        toast.success(
          "Đổi ảnh đại diện thành công",
          "Ảnh mới đã hiển thị khắp trang.",
        );
      },
      onError: (error) => {
        if (error instanceof MediaApiError) {
          toast.error(
            "Đổi ảnh thất bại",
            error.errors.form ?? "Vui lòng thử lại.",
          );
        } else {
          toast.error("Đổi ảnh thất bại", "Vui lòng thử lại sau.");
        }
      },
    });
  }

  return (
    <section
      aria-label="Ảnh đại diện"
      data-reveal
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      {user.avatarUrl ? (
        // biome-ignore lint/performance/noImgElement: dynamic cropped upload served immutable; next/image optimizer hop needs sharp for zero benefit.
        <img
          src={user.avatarUrl}
          alt={`Ảnh đại diện của ${user.fullName}`}
          className="h-16 w-16 shrink-0 rounded-full border border-zinc-200 object-cover dark:border-zinc-800"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-lg font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        >
          {initialsOf(user.fullName)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {user.fullName}
        </h2>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <FiUser aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          Ảnh vuông hiển thị đẹp nhất ở mọi nơi.
        </p>
        <div className="mt-3 max-w-xs">
          <ImageUploader
            scope="avatar"
            ownerType="avatar"
            ownerId={user.id}
            label={saving ? "Đang lưu ảnh…" : "Đổi ảnh đại diện"}
            cropTitle="Cắt ảnh đại diện"
            onUploaded={handleUploaded}
          />
        </div>
      </div>
    </section>
  );
}
