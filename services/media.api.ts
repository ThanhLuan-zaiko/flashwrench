import type {
  MediaAsset,
  MediaFieldErrors,
  MediaScope,
} from "@/lib/media/media.types";
import { AuthApiError, apiRequest } from "./auth.api";

export type { MediaAsset, MediaFieldErrors, MediaScope };

export class MediaApiError extends Error {
  status: number;
  errors: MediaFieldErrors;

  constructor(status: number, errors: MediaFieldErrors) {
    super(errors.form ?? "Đã có lỗi xảy ra.");
    this.name = "MediaApiError";
    this.status = status;
    this.errors = errors;
  }
}

export type UploadMediaInput = {
  file: Blob;
  scope: MediaScope;
  ownerType: string;
  ownerId: string;
  alt?: string;
  width?: number;
  height?: number;
};

function toFieldErrors(body: unknown): MediaFieldErrors {
  if (typeof body === "object" && body !== null) {
    const errors = (body as { errors?: unknown }).errors;
    if (errors && typeof errors === "object") {
      return errors as MediaFieldErrors;
    }
  }
  return { form: "Đã có lỗi xảy ra. Vui lòng thử lại." };
}

// Multipart upload with the same one-refresh retry as apiRequest: the
// access token lives 15 minutes, and losing a cropped upload to an
// expired token would be the login-loop bug all over again.
export async function uploadMediaRequest(
  input: UploadMediaInput,
): Promise<{ asset: MediaAsset }> {
  const form = new FormData();
  form.set("file", input.file);
  form.set("scope", input.scope);
  form.set("ownerType", input.ownerType);
  form.set("ownerId", input.ownerId);
  if (input.alt) form.set("alt", input.alt);
  if (input.width !== undefined) form.set("width", String(input.width));
  if (input.height !== undefined) form.set("height", String(input.height));

  const send = () => fetch("/api/media", { method: "POST", body: form });
  let response = await send();
  if (response.status === 401) {
    const refreshed = await fetch("/api/auth/refresh", { method: "POST" });
    if (refreshed.ok) response = await send();
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new MediaApiError(response.status, toFieldErrors(body));
  }
  return (await response.json()) as { asset: MediaAsset };
}

export function deleteMediaRequest(
  assetId: string,
): Promise<{ assetId: string }> {
  return apiRequest<{ assetId: string }>(
    `/api/media/${encodeURIComponent(assetId)}`,
    { method: "DELETE" },
  ).catch((error: unknown) => {
    if (error instanceof AuthApiError) {
      throw new MediaApiError(error.status, error.errors as MediaFieldErrors);
    }
    throw error;
  });
}

export function setAvatarRequest(
  assetId: string,
): Promise<{ avatarUrl: string }> {
  return apiRequest<{ avatarUrl: string }>("/api/account/avatar", {
    method: "POST",
    body: JSON.stringify({ assetId }),
  }).catch((error: unknown) => {
    if (error instanceof AuthApiError) {
      throw new MediaApiError(error.status, error.errors as MediaFieldErrors);
    }
    throw error;
  });
}
