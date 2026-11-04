// Day pills and hourly time slots for the booking schedule picker, all in
// local `YYYY-MM-DDTHH:mm` strings (the datetime-local format the form
// already stores). Pure: callers pass "now" and the intake bounds.

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const DEFAULT_OPEN_MIN = 8 * 60;
const DEFAULT_CLOSE_MIN = 18 * 60;
const SLOT_STEP_MIN = 60;

export type DayOption = { value: string; weekday: string; day: string };
export type OpenWindow = { opensAtMin: number; closesAtMin: number };

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// "07:00–20:00" (en dash or hyphen) → minutes of day; null when absent
// or malformed, in which case the default 08:00–18:00 grid applies.
export function parseHoursLabel(
  label: string | null | undefined,
): OpenWindow | null {
  const match = label?.match(/^(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const opensAtMin = Number(match[1]) * 60 + Number(match[2]);
  const closesAtMin = Number(match[3]) * 60 + Number(match[4]);
  return closesAtMin > opensAtMin ? { opensAtMin, closesAtMin } : null;
}

export function splitScheduled(value: string): { day: string; time: string } {
  const [day = "", time = ""] = value.split("T");
  return { day, time: time.slice(0, 5) };
}

// Up to `count` consecutive days from the earliest bookable day, stopping
// at the advance cap. The current day is labelled "Hôm nay".
export function bookingDayOptions(
  min: string,
  max: string,
  now: Date,
  count = 7,
): DayOption[] {
  const start = new Date(`${splitScheduled(min).day}T00:00`);
  if (Number.isNaN(start.getTime())) return [];
  const lastDay = max ? splitScheduled(max).day : "";
  const today = dayKey(now);
  const options: DayOption[] = [];
  for (let i = 0; i < count; i += 1) {
    const date = new Date(start.getTime() + i * DAY_MS);
    const value = dayKey(date);
    if (lastDay && value > lastDay) break;
    options.push({
      value,
      weekday: value === today ? "Hôm nay" : (WEEKDAYS[date.getDay()] ?? ""),
      day: pad(date.getDate()),
    });
  }
  return options;
}

// Slots for one day inside the open window (hourly unless a step is given),
// dropping any slot earlier than the intake floor or later than the cap.
export function bookingTimeSlots(
  day: string,
  min: string,
  max: string,
  window: OpenWindow | null,
  stepMin: number = SLOT_STEP_MIN,
): string[] {
  if (!day) return [];
  const opens = window?.opensAtMin ?? DEFAULT_OPEN_MIN;
  const closes = window?.closesAtMin ?? DEFAULT_CLOSE_MIN;
  const slots: string[] = [];
  for (let at = opens; at < closes; at += stepMin) {
    const time = `${pad(Math.floor(at / 60))}:${pad(at % 60)}`;
    const value = `${day}T${time}`;
    if (min && value < min) continue;
    if (max && value > max) continue;
    slots.push(time);
  }
  return slots;
}

// Why a typed time cannot be booked on a day, or null when it can. The open
// window only applies when the shop restricts intake, matching the service
// validation: opening time included, closing time excluded.
export function bookingTimeError(
  day: string,
  time: string,
  min: string,
  max: string,
  window: OpenWindow | null,
): string | null {
  const value = `${day}T${time}`;
  if (min && value < min) {
    return splitScheduled(min).day === day
      ? `Ngày này chỉ nhận từ ${splitScheduled(min).time} trở đi.`
      : "Ngày này chưa đủ thời gian đặt trước.";
  }
  if (max && value > max) {
    return splitScheduled(max).day === day
      ? `Ngày này chỉ nhận đến ${splitScheduled(max).time}.`
      : "Ngày này quá xa so với giới hạn đặt lịch.";
  }
  if (window) {
    const [hours = 0, minutes = 0] = time.split(":").map(Number);
    const at = hours * 60 + minutes;
    if (at < window.opensAtMin || at >= window.closesAtMin) {
      const label = (minute: number) =>
        `${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`;
      return `Shop nhận lịch từ ${label(window.opensAtMin)} đến trước ${label(window.closesAtMin)}.`;
    }
  }
  return null;
}
