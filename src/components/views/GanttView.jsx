import { useState, useMemo } from "react";
import { Calendar, ChevronRight, Plus, X, Flag } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  addMonths,
  parseTaskDate,
  diffDays,
  addDays,
  shortDate,
  operationalRank,
  displayPersonName,
  taskBarTone,
  dateInputValue,
  getOperationalState,
} from "../../lib/utils";
import { operationalStates } from "../../constants/meta";
import Avatar from "../ui/Avatar";

export default function GanttView({ tasks, onSelect, onAdd, canCreate, canEdit, onTaskPatch }) {
  const dayWidth = 30;
  const rowHeight = 48;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [rangeMode, setRangeMode] = useState("2m");
  const [rangeAnchor, setRangeAnchor] = useState(startOfMonth(today));
  const [quickTaskId, setQuickTaskId] = useState(null);

  const range = useMemo(() => {
    const start = startOfMonth(rangeAnchor);
    if (rangeMode === "month") return { start, end: endOfMonth(start) };
    if (rangeMode === "quarter") return { start, end: endOfMonth(addMonths(start, 2)) };
    return { start, end: endOfMonth(addMonths(start, 1)) };
  }, [rangeAnchor, rangeMode]);

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const rank = operationalRank(a) - operationalRank(b);
        if (rank !== 0) return rank;
        const aDate = parseTaskDate(a.dueDate)?.getTime() || Number.MAX_SAFE_INTEGER;
        const bDate = parseTaskDate(b.dueDate)?.getTime() || Number.MAX_SAFE_INTEGER;
        return aDate - bDate || String(a.title).localeCompare(String(b.title));
      }),
    [tasks],
  );

  const datedTasks = sortedTasks
    .map((task) => {
      const due = parseTaskDate(task.dueDate);
      if (!due) return null;
      const rawStart = parseTaskDate(task.startDate) || due;
      const start = rawStart > due ? due : rawStart;
      const end = rawStart > due ? rawStart : due;
      return { task, start, end };
    })
    .filter(Boolean);
  const undatedTasks = sortedTasks.filter((task) => !parseTaskDate(task.dueDate));
  const quickTask = sortedTasks.find((task) => task.id === quickTaskId) || null;
  const visibleRows = [...datedTasks.map((item) => item.task), ...undatedTasks];
  const days = Math.max(diffDays(range.start, range.end) + 1, 21);
  const width = days * dayWidth;
  const todayOffset = diffDays(range.start, today) * dayWidth;
  const monthLabels = [];

  for (let cursor = new Date(range.start); cursor <= range.end; cursor = addDays(cursor, 1)) {
    if (cursor.getDate() === 1 || monthLabels.length === 0) {
      monthLabels.push({
        label: cursor.toLocaleDateString("es-DO", { month: "short", year: "numeric" }),
        left: diffDays(range.start, cursor) * dayWidth,
      });
    }
  }

  function shiftRange(direction) {
    const step = rangeMode === "quarter" ? 3 : rangeMode === "month" ? 1 : 2;
    setRangeAnchor((prev) => startOfMonth(addMonths(prev, direction * step)));
  }

  function patchDate(task, patch) {
    onTaskPatch?.(task.id, patch);
    setQuickTaskId(task.id);
  }

  function assignToday(task) {
    const date = dateInputValue(today);
    patchDate(task, { startDate: date, dueDate: date });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-900">Gantt</h2>
          <p className="text-xs font-semibold text-slate-400">
            {datedTasks.length} con fecha · {undatedTasks.length} sin fecha ·{" "}
            {shortDate(range.start)} - {shortDate(range.end)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRangeAnchor(startOfMonth(today))}
            className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 hover:bg-slate-100"
          >
            Hoy
          </button>
          <div className="flex h-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
            {[
              ["month", "Mes"],
              ["2m", "2 meses"],
              ["quarter", "Trimestre"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setRangeMode(key)}
                className={`px-3 text-xs font-black ${rangeMode === key ? "bg-cyan-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex h-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <button
              onClick={() => shiftRange(-1)}
              className="px-2 text-slate-500 hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </button>
            <button onClick={() => shiftRange(1)} className="px-2 text-slate-500 hover:bg-slate-50">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {canCreate && (
            <button
              onClick={() => onAdd?.("Pendiente")}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-cyan-600 px-3 text-xs font-black text-white hover:bg-cyan-700"
            >
              <Plus className="h-3.5 w-3.5" /> Nueva tarea
            </button>
          )}
        </div>
      </div>

      {quickTask && (
        <div className="border-b border-cyan-100 bg-cyan-50/70 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-900">{quickTask.title}</p>
              <p className="text-xs font-semibold text-slate-500">
                {quickTask.system || "Sin sistema"} ·{" "}
                {displayPersonName(quickTask.assignedName) || "Sin asignar"} ·{" "}
                {quickTask.slaHours ? `${quickTask.slaHours}h SLA` : "Sin SLA"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                disabled={!canEdit}
                type="date"
                value={quickTask.startDate || ""}
                onChange={(e) => patchDate(quickTask, { startDate: e.target.value })}
                className="h-8 rounded-lg border border-cyan-200 bg-white px-2 text-xs font-bold text-slate-700 disabled:bg-slate-100"
              />
              <input
                disabled={!canEdit}
                type="date"
                value={quickTask.dueDate || ""}
                onChange={(e) => patchDate(quickTask, { dueDate: e.target.value })}
                className="h-8 rounded-lg border border-cyan-200 bg-white px-2 text-xs font-bold text-slate-700 disabled:bg-slate-100"
              />
              <input
                disabled={!canEdit}
                type="number"
                min="1"
                value={quickTask.slaHours || ""}
                onChange={(e) => patchDate(quickTask, { slaHours: Number(e.target.value) || "" })}
                placeholder="SLA"
                className="h-8 w-20 rounded-lg border border-cyan-200 bg-white px-2 text-xs font-bold text-slate-700 disabled:bg-slate-100"
              />
              <button
                onClick={() => onSelect(quickTask)}
                className="h-8 rounded-lg bg-slate-900 px-3 text-xs font-black text-white hover:bg-slate-800"
              >
                Abrir card
              </button>
              <button
                onClick={() => setQuickTaskId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid min-h-[560px] grid-cols-[320px_1fr] overflow-hidden">
        <div className="border-r border-slate-200 bg-white">
          <div className="sticky top-0 z-20 flex h-[72px] items-end border-b border-slate-200 bg-white px-3 pb-2 text-[11px] font-black uppercase text-slate-400">
            Tareas
          </div>
          <div>
            {datedTasks.map(({ task }) => {
              const op = operationalStates[getOperationalState(task)] || operationalStates.normal;
              const Op = op.icon;
              return (
                <button
                  key={task.id}
                  onClick={() => setQuickTaskId(task.id)}
                  className="flex h-12 w-full items-center gap-2 border-b border-slate-100 px-3 text-left hover:bg-slate-50"
                >
                  <Avatar name={task.assignedName || "Sin asignar"} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-black text-slate-800">
                      {task.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-semibold text-slate-400">
                      <Op className="h-3 w-3" /> {task.system || "Sin sistema"} ·{" "}
                      {task.slaHours ? `${task.slaHours}h` : "Sin SLA"}
                    </span>
                  </span>
                  {task.dueDate && (
                    <span className="shrink-0 text-[10px] font-bold text-slate-400">
                      {shortDate(parseTaskDate(task.dueDate))}
                    </span>
                  )}
                </button>
              );
            })}
            {undatedTasks.length > 0 && (
              <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase text-slate-400">
                Sin fecha
              </div>
            )}
            {undatedTasks.map((task) => (
              <div
                key={task.id}
                className="flex h-12 items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-3"
              >
                <Calendar className="h-4 w-4 shrink-0 text-slate-300" />
                <button
                  onClick={() => setQuickTaskId(task.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-xs font-bold text-slate-600">
                    {task.title}
                  </span>
                  <span className="block text-[10px] font-semibold text-slate-400">
                    {displayPersonName(task.assignedName) || "Sin asignar"}
                  </span>
                </button>
                {canEdit && (
                  <button
                    onClick={() => assignToday(task)}
                    className="rounded-md bg-white px-2 py-1 text-[10px] font-black text-cyan-700 shadow-sm hover:bg-cyan-50"
                  >
                    Hoy
                  </button>
                )}
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="px-4 py-10 text-center text-sm font-semibold text-slate-400">
                Este board no tiene tareas.
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="relative" style={{ width }}>
            <div className="sticky top-0 z-10 h-[72px] border-b border-slate-200 bg-white">
              <div className="relative h-9 border-b border-slate-100">
                {monthLabels.map((m, idx) => (
                  <span
                    key={`${m.label}-${idx}`}
                    className="absolute top-2 text-[11px] font-black uppercase text-slate-500"
                    style={{ left: m.left + 8 }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
              <div className="relative h-9">
                {Array.from({ length: days }).map((_, idx) => {
                  const date = addDays(range.start, idx);
                  const isWeek = date.getDay() === 1 || idx === 0;
                  return isWeek ? (
                    <span
                      key={idx}
                      className="absolute top-2 text-[10px] font-bold text-slate-400"
                      style={{ left: idx * dayWidth + 6 }}
                    >
                      {shortDate(date)}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
            <div
              className="relative"
              style={{ height: Math.max(visibleRows.length * rowHeight, 440) }}
            >
              {Array.from({ length: days }).map((_, idx) => {
                const date = addDays(range.start, idx);
                const weekend = date.getDay() === 0 || date.getDay() === 6;
                return (
                  <span
                    key={idx}
                    className={`absolute top-0 h-full border-l ${idx % 7 === 0 ? "border-slate-200" : "border-slate-100"} ${weekend ? "bg-slate-50/80" : ""}`}
                    style={{ left: idx * dayWidth, width: dayWidth }}
                  />
                );
              })}
              {todayOffset >= 0 && todayOffset <= width && (
                <span
                  className="absolute top-0 z-10 h-full border-l-2 border-red-500"
                  style={{ left: todayOffset }}
                >
                  <span className="ml-1 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white shadow">
                    Hoy
                  </span>
                </span>
              )}
              {datedTasks.map(({ task, start, end }, idx) => {
                const left = diffDays(range.start, start) * dayWidth;
                const barWidth = Math.max((diffDays(start, end) + 1) * dayWidth, 20);
                const visible = left + barWidth >= 0 && left <= width;
                if (!visible) return null;
                return (
                  <button
                    key={task.id}
                    onClick={() => setQuickTaskId(task.id)}
                    className="absolute flex h-7 items-center rounded-md text-left shadow-sm transition-transform hover:scale-[1.01] hover:shadow-md"
                    style={{ left, top: idx * rowHeight + 10, width: barWidth }}
                    title={`${task.title} · ${shortDate(start)} - ${shortDate(end)}`}
                  >
                    <span
                      className={`flex h-full w-full items-center gap-1 overflow-hidden rounded-md px-2 text-[11px] font-black text-white ${taskBarTone(task)}`}
                    >
                      <Flag className="h-3 w-3 shrink-0" />
                      <span className="truncate">{task.title}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
