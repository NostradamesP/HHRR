import { defaultItConfig } from "../constants/itConfig";
import { makeChecklist } from "../value-objects/checklist";
import {
  DEFAULT_LOCAL_ASSIGNED,
  DEFAULT_LOCAL_ASSIGNED_NAME,
  DEFAULT_LOCAL_REQUESTER,
} from "../constants/meta";

export function createTask(input = {}) {
  return {
    id: String(input.id ?? ""),
    title: input.title ?? "",
    description: input.description ?? "",
    phase: input.phase ?? "",
    module: input.module ?? "",
    priority: input.priority ?? "Media",
    status: input.status ?? "Pendiente",
    effort: input.effort ?? "Medio",
    order: input.order ?? 0,
    startDate: input.startDate ?? "",
    dueDate: input.dueDate ?? "",
    archived: Boolean(input.archived),
    assignedTo: input.assignedTo ?? "",
    assignedName: input.assignedName ?? "",
    ticketType: input.ticketType ?? "",
    requester: input.requester ?? "",
    system: input.system ?? "",
    impact: input.impact ?? "Medio",
    urgency: input.urgency ?? "Media",
    slaHours: input.slaHours ?? 72,
    checklist: Array.isArray(input.checklist) ? input.checklist : makeChecklist(input.title),
    operationalState: input.operationalState ?? "normal",
    blockedReason: input.blockedReason ?? "",
    createdAt: input.createdAt ?? null,
    updatedAt: input.updatedAt ?? null,
    ...input,
  };
}

export function enrichLocalTask(task, idx = 0, config = defaultItConfig) {
  const base = createTask(task);
  return {
    ...base,
    id: String(task.id),
    order: task.order ?? idx,
    startDate: task.startDate || "",
    dueDate: task.dueDate || "",
    archived: Boolean(task.archived),
    assignedTo: task.assignedTo || DEFAULT_LOCAL_ASSIGNED,
    assignedName: task.assignedName || DEFAULT_LOCAL_ASSIGNED_NAME,
    ticketType: task.ticketType || config.ticketTypes[idx % config.ticketTypes.length],
    requester: task.requester || DEFAULT_LOCAL_REQUESTER,
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
