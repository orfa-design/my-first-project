export const TIME_ZONE = "Europe/Kyiv";

/** Сьогоднішня дата за київським часом у форматі YYYY-MM-DD. */
export function todayKyiv(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

const dayMonth = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long", timeZone: "UTC" });
const weekday = new Intl.DateTimeFormat("uk-UA", { weekday: "short", timeZone: "UTC" });

/** «12 листопада, пт» */
export function formatDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return `${dayMonth.format(d)}, ${weekday.format(d)}`;
}

/** Відносний опис дедлайну: «сьогодні», «завтра», «через 3 дн.», «прострочено на 2 дн.» */
export function relativeDue(isoDate: string, today = todayKyiv()): string {
  const diff = daysBetween(today, isoDate);
  if (diff === 0) return "сьогодні";
  if (diff === 1) return "завтра";
  if (diff === -1) return "учора";
  if (diff > 1) return `через ${diff} дн.`;
  return `${-diff} дн. тому`;
}
