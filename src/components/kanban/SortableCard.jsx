import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreVertical, X } from "lucide-react";
import { isTaskOverdue, isReadyToClose } from "../../lib/utils";
import CardContent from "./CardContent";

export default function SortableCard({
  task,
  onSelect,
  isAdmin,
  deleteMode,
  onDelete,
  deletingId,
  index = 0,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !isAdmin || deleteMode,
  });
  const s = { transform: CSS.Transform.toString(transform), transition };

  const overdue = isTaskOverdue(task);
  const isBlocked = task.status === "Bloqueado";
  const isCritical = task.urgency === "Crítica";
  const ready = isReadyToClose(task);

  let borderClass = "";
  if (isBlocked) borderClass = "border-l-4 border-l-red-500";
  else if (overdue) borderClass = "border-l-4 border-l-orange-400";
  else if (ready) borderClass = "border-l-4 border-l-emerald-400";
  else if (isCritical) borderClass = "border-l-4 border-l-rose-400";

  function openCard(e) {
    if (deleteMode) return;
    const tag = e.target?.tagName;
    if (["BUTTON", "INPUT", "SELECT", "TEXTAREA", "OPTION"].includes(tag)) return;
    onSelect(task);
  }

  const animDelay = Math.min(index * 50, 300);
  const cardStyle = isDragging ? s : { ...s, animationDelay: `${animDelay}ms` };

  return (
    <div
      ref={setNodeRef}
      style={cardStyle}
      {...attributes}
      {...listeners}
      onClick={openCard}
      className={`group relative rounded-lg border border-slate-200/80 bg-white px-2 md:px-2.5 py-1.5 md:py-2 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-all ${borderClass} ${isAdmin && !deleteMode ? "cursor-grab active:cursor-grabbing" : deleteMode ? "cursor-default" : "cursor-pointer"} ${isDragging ? "z-50 rotate-1 scale-[1.02] shadow-xl ring-2 ring-cyan-300 opacity-40" : "opacity-0-initial animate-fade-in-up hover:border-slate-300 hover:shadow-md"}`}
    >
      {isAdmin && !deleteMode && (
        <button
          type="button"
          aria-label="Arrastrar tarea"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0.5 top-0.5 z-10 flex h-7 w-7 md:h-5 md:w-5 items-center justify-center rounded-md text-slate-300 hover:bg-slate-100 hover:text-slate-600"
        >
          <MoreVertical className="h-3.5 w-3.5 md:h-3 md:w-3" />
        </button>
      )}
      {deleteMode && isAdmin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("¿Eliminar esta tarea?")) {
              onDelete(task.id);
            }
          }}
          disabled={deletingId === task.id}
          className="absolute -right-1.5 -top-1.5 z-10 flex h-8 w-8 md:h-6 md:w-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 disabled:opacity-40 transition-colors"
        >
          <X className="h-4 w-4 md:h-3.5 md:w-3.5" />
        </button>
      )}
      <CardContent task={task} />
    </div>
  );
}
