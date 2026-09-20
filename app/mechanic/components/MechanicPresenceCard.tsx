"use client";

import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiChevronUp, FiCrosshair } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import {
  useMechanicPresence,
  useUpdateMechanicPresence,
} from "@/hooks/mechanic";
import { AuthApiError } from "@/services/mechanic.api";
import { needsBasePoint, presenceStatusText } from "./presence-form.utils";

const SKILL_OPTIONS = [
  { id: "engine", label: "Động cơ" },
  { id: "tire", label: "Lốp xe" },
  { id: "battery", label: "Ắc quy" },
  { id: "brake", label: "Phanh" },
  { id: "ac", label: "Điều hòa" },
  { id: "electrical", label: "Điện" },
  { id: "diagnostics", label: "Chẩn đoán" },
] as const;

// The mechanic's bookable switchboard. Expanding it reveals the three
// inputs the directory cares about — online, skills, base location — and
// one save that PATCHes /api/mechanic/profile. Going online here is what
// lists the mechanic for customer pickers and the auto-dispatch sweep.
export function MechanicPresenceCard({
  displayName,
}: {
  displayName: string | null;
}) {
  const toast = useToast();
  const presence = useMechanicPresence();
  const saver = useUpdateMechanicPresence();
  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [baseLat, setBaseLat] = useState<number | null>(null);
  const [baseLng, setBaseLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);

  // Hydrate once per open session (or when the first fetch lands while
  // open). A refetch mid-edit must not clobber the draft.
  const hydrated = useRef(false);
  useEffect(() => {
    const profile = presence.data?.profile;
    if (!open) {
      hydrated.current = false;
      return;
    }
    if (!profile || hydrated.current) return;
    hydrated.current = true;
    setOnline(profile.online);
    setSkills(profile.skills);
    setBaseLat(profile.baseLat);
    setBaseLng(profile.baseLng);
  }, [open, presence.data]);

  const onlineNow = presence.data?.profile.online === true;
  const statusText = presenceStatusText(
    presence.isLoading,
    onlineNow,
    displayName,
  );
  const hasBase = baseLat !== null && baseLng !== null;
  const needsBase = needsBasePoint({ online, baseLat, baseLng });

  const toggleSkill = (id: string) => {
    setSkills((current) =>
      current.includes(id)
        ? current.filter((skill) => skill !== id)
        : [...current, id],
    );
  };

  const locateBase = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Thiết bị không hỗ trợ định vị", "Nhập tọa độ thủ công.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setBaseLat(position.coords.latitude);
        setBaseLng(position.coords.longitude);
      },
      () => {
        setLocating(false);
        toast.error(
          "Không lấy được vị trí",
          "Hãy cho phép trình duyệt truy cập vị trí.",
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  };

  const save = () => {
    saver.mutate(
      { online, skills, baseLat, baseLng },
      {
        onSuccess: () => {
          toast.success(
            "Đã cập nhật trạng thái",
            online
              ? "Bạn đang trực tuyến và có thể nhận đơn."
              : "Bạn đã chuyển sang ngoại tuyến.",
          );
        },
        onError: (error) => {
          toast.error(
            "Không lưu được trạng thái",
            error instanceof AuthApiError ? error.message : "Vui lòng thử lại.",
          );
        },
      },
    );
  };

  return (
    <div className="mt-4 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 rounded-lg"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${
                onlineNow
                  ? "bg-zinc-900 motion-safe:animate-pulse dark:bg-zinc-100"
                  : "bg-zinc-400 dark:bg-zinc-600"
              }`}
            />
            Sẵn sàng nhận việc
          </span>
          <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
            {statusText}
          </span>
        </span>
        {open ? (
          <FiChevronUp
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-zinc-500"
          />
        ) : (
          <FiChevronDown
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-zinc-500"
          />
        )}
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <label className="flex items-center justify-between gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Trực tuyến
            <input
              type="checkbox"
              checked={online}
              onChange={(event) => setOnline(event.target.checked)}
              className="h-4 w-4 accent-zinc-900 dark:accent-zinc-100"
              aria-label="Bật trực tuyến"
            />
          </label>

          <fieldset>
            <legend className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Kỹ năng
            </legend>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {SKILL_OPTIONS.map((skill) => {
                const active = skills.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggleSkill(skill.id)}
                    aria-pressed={active}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-95 ${
                      active
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                        : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    }`}
                  >
                    {skill.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Điểm xuất phát
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                {hasBase
                  ? `${baseLat?.toFixed(5)}, ${baseLng?.toFixed(5)}`
                  : "Chưa có tọa độ"}
              </span>
              <button
                type="button"
                onClick={locateBase}
                disabled={locating}
                aria-label="Lấy vị trí hiện tại làm điểm xuất phát"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-300 text-zinc-600 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 motion-safe:active:scale-95 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                <FiCrosshair
                  aria-hidden="true"
                  className={`h-4 w-4 ${locating ? "motion-safe:animate-pulse" : ""}`}
                />
              </button>
            </div>
            {needsBase && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                Cần điểm xuất phát trước khi trực tuyến.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saver.isPending || needsBase || presence.isLoading}
            className="flex min-h-[40px] w-full items-center justify-center rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 motion-safe:active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {saver.isPending ? "Đang lưu…" : "Lưu trạng thái"}
          </button>
        </div>
      )}
    </div>
  );
}
