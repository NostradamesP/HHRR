import { isOverdue } from "../value-objects/date";
import { checklistProgress, isChecklistComplete } from "../value-objects/checklist";
import { displayPersonName } from "./formatService";

export function isUrgentTask(task) {
  return task?.urgency === "Crítica" || task?.urgency === "Alta" || task?.priority === "Alta";
}

export function isTaskOverdue(task) {
  return isOverdue(task?.dueDate, task?.status);
}

export function getOperationalState(task) {
  if (task?.status === "Bloqueado") return "blocked";
  return task?.operationalState || "normal";
}

export function isReadyToClose(task) {
  return task?.status !== "Hecho" && isChecklistComplete(task);
}

export function operationalRank(task) {
  if (isTaskOverdue(task)) return 0;
  if (getOperationalState(task) === "blocked") return 1;
  if (isUrgentTask(task)) return 2;
  if (!task?.assignedTo && !task?.assignedName) return 3;
  if (isReadyToClose(task)) return 4;
  return 5;
}

export function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function reportSummary(tasks = []) {
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

export function displayNameFromUser(userData) {
  return displayPersonName(userData?.name);
}

export { displayPersonName, cleanValue } from "./formatService";
