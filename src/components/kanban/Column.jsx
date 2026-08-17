import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ChevronRight, ChevronDown, Plus } from "lucide-react";
import { statusMeta } from "../../constants/meta";
import { effortWeight } from "../../constants/meta";
import SortableCard from "./SortableCard";
import DroppableZone from "../ui/DroppableZone";

export default function Column({
  status,
  items,
  collapsed,
  toggleCollapse,
  isAdmin,
  deleteMode,
  onSelect,
  onDelete,
  onAdd,
  onTaskPatch: _onTaskPatch,
  users: _users,
  deletingId,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    disabled: !isAdmin || deleteMode,
  });
  const colDone = items.filter((t) => t.status === "Hecho").length;
  const colTotal = items.length;
  const colProgress = colTotal ? Math.round((colDone / colTotal) * 100) : 0;

  const colAccents = statusMeta[status] || statusMeta.Pendiente;
  const StatusIcon = colAccents.icon;

  return (
    <div
      ref={setNodeRef}
      data-over={isOver ? "true" : "false"}
      className={`group min-w-[280px] snap-start rounded-xl border border-slate-200/80 bg-slate-100/80 shadow-sm transition-colors sm:min-w-[320px] md:min-w-0 ${isOver ? "ring-2 ring-cyan-200" : ""}`}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleCollapse(status)}
            aria-label={collapsed[status] ? `Expandir columna ${status}` : `Colapsar columna ${status}`}
            aria-expanded={!collapsed[status]}
            className="flex h-8 w-8 md:h-6 md:w-6 items-center justify-center rounded-md text-slate-400 hover:bg-white hover:text-slate-700"
          >
            {collapsed[status] ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <StatusIcon className={`h-4 w-4 ${colAccents.tone}`} />
          <h2 className="text-sm font-bold text-slate-800">{status}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-slate-500 shadow-sm">
            {items.length}
          </span>
          {!collapsed[status] && colTotal > 0 && (
            <span className="text-[10px] text-slate-400">
              {items.reduce((a, t) => a + (effortWeight[t.effort] || 0), 0)}pts
            </span>
          )}
          {isAdmin && (
            <button
              onClick={() => onAdd(status)}
              className="flex h-8 w-8 md:h-6 md:w-6 items-center justify-center rounded-md text-slate-400 hover:bg-white hover:text-cyan-600"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div
        className={`overflow-hidden transition-all ${collapsed[status] ? "max-h-0" : "max-h-[9999px]"}`}
      >
        {colTotal > 0 && (
          <div className="px-3">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Progreso</span>
              <span>{colProgress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-300 ${colAccents.accent}`}
                style={{ width: `${colProgress}%` }}
              />
            </div>
          </div>
        )}
        <div className="p-1.5">
          <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <Plus className="h-5 w-5 text-slate-300" />
                </div>
                <p className="text-xs font-semibold text-slate-400">Sin tareas</p>
                {isAdmin && (
                  <button
                    onClick={() => onAdd(status)}
                    className="mt-2 rounded-lg px-3 py-2 md:px-0 md:py-0 text-xs font-bold text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 md:hover:bg-transparent transition-colors"
                  >
                    Agregar primera tarea
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {items.map((t, i) => (
                  <SortableCard
                    key={t.id}
                    task={t}
                    index={i}
                    onSelect={onSelect}
                    isAdmin={isAdmin}
                    deleteMode={deleteMode}
                    onDelete={onDelete}
                    deletingId={deletingId}
                  />
                ))}
                {isAdmin && <DroppableZone />}
              </div>
            )}
          </SortableContext>
        </div>
      </div>
    </div>
  );
}
