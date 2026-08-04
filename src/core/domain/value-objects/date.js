export function parseTaskDate(value) {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfMonth(date) {
  const next = new Date(date);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function endOfMonth(date) {
  const next = startOfMonth(addMonths(date, 1));
  return addDays(next, -1);
}

export function diffDays(a, b) {
  const start = startOfDay(new Date(a));
  const end = startOfDay(new Date(b));
  return Math.round((end - start) / 86400000);
}

export function dateInputValue(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function isOverdue(dueDate, status) {
  if (!dueDate || status === "Hecho") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate) < today;
}
