import {
  Lock,
  Server,
  Tag,
  Clock3,
  CheckCircle2,
  MessageSquare,
  Flame,
  User,
  Paperclip,
} from "lucide-react";
import { priorityMeta, operationalStates, modColors } from "../../constants/meta";
import {
  checklistProgress,
  getOperationalState,
} from "../../lib/utils";
import DueDateBadge from "../ui/DueDateBadge";
import Avatar from "../ui/Avatar";

export default function CardContent({ task }) {
  const meta = priorityMeta[task.priority] || priorityMeta.Media;
  const PriorityIcon = meta.icon;
  const checklist = checklistProgress(task);
  const isBlocked = task.status === "Bloqueado";
  const opKey = getOperationalState(task);
  const opMeta = operationalStates[opKey] || {
    ...operationalStates.normal,
    label: opKey || "Normal",
  };
  const OpIcon = opMeta.icon;
  const badgeBase =
    "inline-flex h-[22px] max-w-[132px] items-center gap-1 rounded-md border px-1.5 text-[10px] font-semibold leading-none";

  function CardBadge({ icon: Icon, children, className = "" }) {
    return (
      <span className={`${badgeBase} ${className}`}>
        {Icon && <Icon className="h-3 w-3 shrink-0" />}
        <span className="truncate">{children}</span>
      </span>
    );
  }

  return (
    <div className="space-y-1 md:space-y-1.5">
      <div className="flex items-start justify-between gap-1.5 md:gap-2">
        <h3 className="flex min-w-0 flex-1 items-start gap-1 md:gap-1.5 pr-4 md:pr-6 text-xs md:text-[13px] font-bold leading-snug text-slate-950">
          <PriorityIcon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${meta.tone.split(" ")[0]}`} />
          <span className="line-clamp-2">{task.title}</span>
          {isBlocked && <Lock className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />}
        </h3>
      </div>

      <div className="flex flex-wrap gap-1">
        <CardBadge icon={Server} className="border-cyan-100 bg-cyan-50 text-cyan-700">
          {task.system || "Sin sistema"}
        </CardBadge>
        <CardBadge className="border-slate-200 bg-white text-slate-700">
          {task.ticketType || "Sin tipo"}
        </CardBadge>
        <span
          className={`${badgeBase} ${modColors[task.module] || "bg-slate-100 text-slate-600"} border-transparent`}
        >
          <Tag className="h-3 w-3" />
          {task.module || "Sin módulo"}
        </span>
        <CardBadge icon={PriorityIcon} className={meta.tone}>
          {task.priority || "Prioridad"}
        </CardBadge>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-t border-slate-100 pt-1.5">
        {opKey !== "normal" && (
          <CardBadge icon={OpIcon} className={opMeta.tone}>
            {opMeta.label}
          </CardBadge>
        )}
        {(task.urgency === "Crítica" || task.urgency === "Alta") && (
          <CardBadge icon={Flame} className="border-amber-100 bg-amber-50 text-amber-700">
            Urg. {task.urgency}
          </CardBadge>
        )}
        {task.slaHours && (
          <CardBadge icon={Clock3} className="border-cyan-100 bg-cyan-50 text-cyan-700">
            {task.slaHours}h SLA
          </CardBadge>
        )}
        {checklist.total > 0 && (
          <CardBadge icon={CheckCircle2} className="border-slate-200 bg-slate-50 text-slate-600">
            {checklist.done}/{checklist.total}
          </CardBadge>
        )}
        {Number(task.commentsCount || 0) > 0 && (
          <CardBadge icon={MessageSquare} className="border-slate-200 bg-slate-50 text-slate-600">
            {task.commentsCount}
          </CardBadge>
        )}
        {Array.isArray(task.attachments) && task.attachments.length > 0 && (
          <CardBadge icon={Paperclip} className="border-slate-200 bg-slate-50 text-slate-600">
            {task.attachments.length}
          </CardBadge>
        )}
        {task.dueDate && <DueDateBadge dueDate={task.dueDate} />}
        <div className="ml-auto flex shrink-0 items-center">
          {task.assignedName ? (
            <Avatar name={task.assignedName} size="sm" />
          ) : (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-300">
              <User className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
