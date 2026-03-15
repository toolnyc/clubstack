/**
 * Calendar date utilities.
 */

function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function getMonthGridDays(year: number, month: number): Date[] {
  const days = getMonthDays(year, month);
  const firstDay = days[0].getDay();
  const lastDay = days[days.length - 1].getDay();

  // Pad start with previous month days
  const padStart: Date[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    padStart.push(d);
  }

  // Pad end with next month days
  const padEnd: Date[] = [];
  for (let i = 1; i <= 6 - lastDay; i++) {
    const d = new Date(year, month + 1, i);
    padEnd.push(d);
  }

  return [...padStart, ...days, ...padEnd];
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function isToday(date: Date): boolean {
  const now = new Date();
  return toDateString(date) === toDateString(now);
}

function isSameMonth(date: Date, month: number): boolean {
  return date.getMonth() === month;
}

export {
  getMonthDays,
  getMonthGridDays,
  formatDateShort,
  formatDateLong,
  formatMonthYear,
  toDateString,
  isToday,
  isSameMonth,
};
