// Calendar helpers for DateTimeDropdown. Everything works on local
// `YYYY-MM-DDTHH:mm` wall-time strings, so no time zone math happens here.

const WEEKDAY_NAMES = [
  "Chủ nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
];

export const WEEKDAY_HEADERS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export type MonthView = { year: number; month: number };

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function splitDateTime(value: string): { day: string; time: string } {
  const [day = "", time = ""] = value.split("T");
  return { day, time: time.slice(0, 5) };
}

// Month holding a `YYYY-MM-DD...` string; month is 0-based. Falls back to
// the given date when the string is empty or malformed.
export function monthOf(value: string, fallback: Date): MonthView {
  const match = value.match(/^(\d{4})-(\d{2})/);
  if (!match) {
    return { year: fallback.getFullYear(), month: fallback.getMonth() };
  }
  return { year: Number(match[1]), month: Number(match[2]) - 1 };
}

export function shiftMonth(view: MonthView, delta: number): MonthView {
  const date = new Date(view.year, view.month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function monthKey(view: MonthView): string {
  return `${view.year}-${pad(view.month + 1)}`;
}

export function monthLabel(view: MonthView): string {
  return `Tháng ${view.month + 1}, ${view.year}`;
}

// Monday-first grid: leading nulls pad the first week.
export function monthDays(view: MonthView): Array<string | null> {
  const first = new Date(view.year, view.month, 1);
  const count = new Date(view.year, view.month + 1, 0).getDate();
  const cells: Array<string | null> = Array.from(
    { length: (first.getDay() + 6) % 7 },
    () => null,
  );
  for (let day = 1; day <= count; day += 1) {
    cells.push(`${monthKey(view)}-${pad(day)}`);
  }
  return cells;
}

// "Thứ Bảy, 07/11/2026 · 09:00"; empty string for a malformed value.
export function dateTimeLabel(value: string): string {
  const { day, time } = splitDateTime(value);
  const match = day.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  const [, year, month, date] = match;
  const weekday = new Date(
    Number(year),
    Number(month) - 1,
    Number(date),
  ).getDay();
  const prefix = `${WEEKDAY_NAMES[weekday]}, ${date}/${month}/${year}`;
  return time ? `${prefix} · ${time}` : prefix;
}

// "T5, 05/11/2026" for narrow date-only triggers; empty when malformed.
export function shortDateLabel(value: string): string {
  const { day } = splitDateTime(value);
  const match = day.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  const [, year, month, date] = match;
  const weekday = new Date(
    Number(year),
    Number(month) - 1,
    Number(date),
  ).getDay();
  const index = (weekday + 6) % 7;
  return `${WEEKDAY_HEADERS[index]}, ${date}/${month}/${year}`;
}

// Every quarter hour of a day, "00:00" to "23:45".
export function quarterHourTimes(): string[] {
  const times: string[] = [];
  for (let minute = 0; minute < 24 * 60; minute += 15) {
    times.push(`${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`);
  }
  return times;
}

// Adds values that sit off the grid (a saved 13:07, an end of day 23:59).
export function withExtraTimes(
  times: string[],
  ...extras: Array<string | null | undefined>
): string[] {
  const merged = new Set(times);
  for (const extra of extras) {
    if (extra) merged.add(extra);
  }
  return [...merged].sort();
}

// Scrolls a child to the upper part of its own scroll box, leaving the page
// where it is.
export function scrollWithinBox(child: HTMLElement | null): void {
  const box = child?.parentElement;
  if (child && box) {
    box.scrollTop = child.offsetTop - box.offsetTop - box.clientHeight / 3;
  }
}

// Reads typed time such as "9", "9:30", "930", "0930" or "09.30" into "HH:mm";
// null when it is not a real time of day.
export function parseTimeInput(raw: string): string | null {
  const text = raw.trim().replace(/\s+/g, "");
  const match =
    text.match(/^(\d{1,2})(?:[:.hH](\d{2})?)?$/) ??
    text.match(/^(\d{1,2})(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  if (hours > 23 || minutes > 59) return null;
  return `${pad(hours)}:${pad(minutes)}`;
}
