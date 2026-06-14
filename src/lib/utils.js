import { defaultItConfig } from "../constants/defaultItConfig";

export function readLocalJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeLocalJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("localStorage write failed:", key, e);
  }
}

export function makeChecklist(title) {
  return [
    { id: "scope", text: "Validar alcance", done: false },
    {
      id: "execute",
      text: title?.toLowerCase().includes("research")
        ? "Documentar hallazgos"
        : "Ejecutar trabajo técnico",
      done: false,
    },
    { id: "verify", text: "Verificar y cerrar", done: false },
  ];
}

export function enrichLocalTask(task, idx, config = defaultItConfig) {
  return {
    ...task,
    id: String(task.id),
    order: task.order ?? idx,
    startDate: task.startDate || "",
    dueDate: task.dueDate || "",
    archived: Boolean(task.archived),
    assignedTo: task.assignedTo || "local-demo-user",
    assignedName: task.assignedName || "IT Manager",
    ticketType: task.ticketType || config.ticketTypes[idx % config.ticketTypes.length],
    requester: task.requester || "Operaciones IT",
    system: task.system || config.systems[idx % config.systems.length],
    impact: task.impact || (task.priority === "Alta" ? "Alto" : "Medio"),
    urgency: task.urgency || (task.priority === "Alta" ? "Alta" : "Media"),
    slaHours: task.slaHours || (task.priority === "Alta" ? 24 : 72),
    checklist:
      Array.isArray(task.checklist) && task.checklist.length
        ? task.checklist
        : makeChecklist(task.title),
    operationalState: task.operationalState || "normal",
    blockedReason: task.blockedReason || "",
  };
}

export function checklistProgress(task) {
  const items = Array.isArray(task.checklist) ? task.checklist : [];
  if (!items.length) return { done: 0, total: 0, pct: 0 };
  const done = items.filter((i) => i.done).length;
  return { done, total: items.length, pct: Math.round((done / items.length) * 100) };
}

export function isTaskOverdue(task) {
  if (!task.dueDate || task.status === "Hecho") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.dueDate) < today;
}

export function getOperationalState(task) {
  if (task.status === "Bloqueado") return "blocked";
  return task.operationalState || "normal";
}

export function isReadyToClose(task) {
  const checklist = checklistProgress(task);
  return task.status !== "Hecho" && checklist.total > 0 && checklist.done === checklist.total;
}

export function operationalRank(task) {
  if (isTaskOverdue(task)) return 0;
  if (getOperationalState(task) === "blocked") return 1;
  if (task.urgency === "Crítica" || task.urgency === "Alta" || task.priority === "Alta") return 2;
  if (!task.assignedTo && !task.assignedName) return 3;
  if (isReadyToClose(task)) return 4;
  return 5;
}

export function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function parseTaskDate(value) {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
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

export function dateInputValue(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function diffDays(a, b) {
  const start = new Date(a);
  const end = new Date(b);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end - start) / 86400000);
}

export function shortDate(date) {
  return date.toLocaleDateString("es-DO", { day: "numeric", month: "short" });
}

export function isUrgentTask(task) {
  return task.urgency === "Crítica" || task.urgency === "Alta" || task.priority === "Alta";
}

export function taskBarTone(task) {
  if (isTaskOverdue(task)) return "bg-red-500";
  if (getOperationalState(task) === "blocked") return "bg-rose-500";
  if (task.status === "Hecho") return "bg-emerald-500";
  if (isUrgentTask(task)) return "bg-amber-500";
  return "bg-cyan-600";
}

export function groupCounts(tasks, getter, fallback = "Sin definir") {
  const counts = new Map();
  tasks.forEach((task) => {
    const key = cleanValue(getter(task)) || fallback;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

export function reportSummary(tasks) {
  const checklist = tasks.reduce(
    (acc, task) => {
      const progress = checklistProgress(task);
      acc.total += progress.total;
      acc.done += progress.done;
      return acc;
    },
    { total: 0, done: 0 },
  );
  return {
    total: tasks.length,
    overdue: tasks.filter(isTaskOverdue).length,
    blocked: tasks.filter((task) => getOperationalState(task) === "blocked").length,
    unassigned: tasks.filter((task) => !task.assignedTo && !task.assignedName).length,
    urgent: tasks.filter(isUrgentTask).length,
    completed: tasks.filter((task) => task.status === "Hecho").length,
    checklistDone: checklist.done,
    checklistTotal: checklist.total,
    checklistPct: checklist.total ? Math.round((checklist.done / checklist.total) * 100) : 0,
  };
}

export function cleanValue(value) {
  return String(value ?? "").trim();
}

export function displayPersonName(name) {
  const clean = cleanValue(name);
  if (!clean) return "";
  return clean === "Demo NoraHR" ? "IT Manager" : clean;
}

export function uniqueOptions(values) {
  const seen = new Set();
  return values
    .map(cleanValue)
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Error reading file"));
    reader.readAsDataURL(file);
  });
}
