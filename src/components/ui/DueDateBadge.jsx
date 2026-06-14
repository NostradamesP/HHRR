import { Flame, Calendar } from "lucide-react";

export default function DueDateBadge({ dueDate }) {
  const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  const isOverdue = days < 0;
  const color = isOverdue
    ? "text-red-600 bg-red-50 border-red-200"
    : days <= 3
      ? "text-amber-600 bg-amber-50 border-amber-200"
      : "text-emerald-600 bg-emerald-50 border-emerald-200";
  const label =
    days < 0
      ? `Vencida`
      : days === 0
        ? `Hoy`
        : days === 1
          ? `Mañana`
          : days > 30
            ? `> 30 días`
            : `${days} días`;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${color}`}
    >
      {isOverdue ? <Flame className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
      {label}
    </span>
  );
}
