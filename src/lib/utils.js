import {
  isTaskOverdue,
  getOperationalState,
  isUrgentTask,
} from "../core/domain/services/taskService";

export { readLocalJSON, writeLocalJSON } from "../infrastructure/local/storage";

export function shortDate(date) {
  return date.toLocaleDateString("es-DO", { day: "numeric", month: "short" });
}

export function taskBarTone(task) {
  if (isTaskOverdue(task)) return "bg-red-500";
  if (getOperationalState(task) === "blocked") return "bg-rose-500";
  if (task.status === "Hecho") return "bg-emerald-500";
  if (isUrgentTask(task)) return "bg-amber-500";
  return "bg-cyan-600";
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

export { makeChecklist, checklistProgress } from "../core/domain/value-objects/checklist";
export {
  parseTaskDate,
  addDays,
  startOfMonth,
  addMonths,
  endOfMonth,
  dateInputValue,
  diffDays,
} from "../core/domain/value-objects/date";
export { enrichLocalTask } from "../core/domain/entities/task";
export {
  isTaskOverdue,
  getOperationalState,
  isReadyToClose,
  operationalRank,
  csvCell,
  isUrgentTask,
  reportSummary,
} from "../core/domain/services/taskService";
export { groupCounts, uniqueOptions } from "../core/domain/services/filterService";
export { cleanValue, sanitizeText, displayPersonName } from "../core/domain/services/formatService";
