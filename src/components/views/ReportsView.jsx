import { useMemo } from "react";
import {
  LayoutDashboard,
  Flame,
  Lock,
  User,
  Flag,
  CheckCircle2,
  BarChart3,
  Users,
  Server,
  Download,
  Printer,
} from "lucide-react";
import {
  reportSummary,
  groupCounts,
  isTaskOverdue,
  getOperationalState,
  isUrgentTask,
  displayPersonName,
} from "../../lib/utils";
import { operationalStates } from "../../constants/meta";

export default function ReportsView({ tasks, allTasks, boardName, onExport, onPrint, onSelect }) {
  const summary = useMemo(() => reportSummary(tasks), [tasks]);
  const allSummary = useMemo(
    () => reportSummary(allTasks.filter((task) => !task.archived)),
    [allTasks],
  );
  const byResponsible = useMemo(
    () => groupCounts(tasks, (task) => task.assignedName, "Sin asignar").slice(0, 8),
    [tasks],
  );
  const bySystem = useMemo(
    () => groupCounts(tasks, (task) => task.system, "Sin sistema").slice(0, 8),
    [tasks],
  );
  const byStatus = useMemo(() => groupCounts(tasks, (task) => task.status, "Sin estado"), [tasks]);
  const maxGroupValue = Math.max(
    1,
    ...byResponsible.map((item) => item.value),
    ...bySystem.map((item) => item.value),
    ...byStatus.map((item) => item.value),
  );
  const reportCards = [
    {
      label: "Tareas visibles",
      value: summary.total,
      icon: LayoutDashboard,
      tone: "border-slate-200 bg-white text-slate-800",
    },
    {
      label: "Vencidas",
      value: summary.overdue,
      icon: Flame,
      tone: "border-red-100 bg-red-50 text-red-700",
    },
    {
      label: "Bloqueadas",
      value: summary.blocked,
      icon: Lock,
      tone: "border-rose-100 bg-rose-50 text-rose-700",
    },
    {
      label: "Sin asignar",
      value: summary.unassigned,
      icon: User,
      tone: "border-slate-200 bg-slate-50 text-slate-700",
    },
    {
      label: "Alta urgencia",
      value: summary.urgent,
      icon: Flag,
      tone: "border-amber-100 bg-amber-50 text-amber-700",
    },
    {
      label: "Completadas",
      value: summary.completed,
      icon: CheckCircle2,
      tone: "border-emerald-100 bg-emerald-50 text-emerald-700",
    },
  ];

  function GroupChart({ title, items, icon: Icon }) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
            <Icon className="h-4 w-4 text-cyan-600" />
            {title}
          </h3>
          <span className="text-[10px] font-black uppercase text-slate-300">
            {items.length} grupos
          </span>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-bold text-slate-700">{item.label}</span>
                <span className="font-black text-slate-500">{item.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-cyan-600"
                  style={{ width: `${Math.max(6, (item.value / maxGroupValue) * 100)}%` }}
                />
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="py-8 text-center text-sm font-semibold text-slate-400">
              Sin datos para mostrar.
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <div className="report-print space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-cyan-700">Reporte operativo</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">{boardName}</h2>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              {summary.total} tareas visibles · {allSummary.total} activas en el board · generado{" "}
              {new Date().toLocaleString("es-DO")}
            </p>
          </div>
          <div className="report-actions flex flex-wrap items-center gap-2">
            <button
              onClick={onExport}
              className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" /> CSV visible
            </button>
            <button
              onClick={onPrint}
              className="flex h-9 items-center gap-2 rounded-xl bg-slate-900 px-3 text-xs font-black text-white hover:bg-slate-800"
            >
              <Printer className="h-4 w-4" /> Imprimir / PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        {reportCards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className={`rounded-xl border px-3 py-3 shadow-sm ${tone}`}>
            <div className="flex items-center justify-between">
              <Icon className="h-4 w-4" />
              <span className="text-2xl font-black">{value}</span>
            </div>
            <p className="mt-2 text-[10px] font-black uppercase tracking-wide opacity-75">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
        <GroupChart title="Por responsable" items={byResponsible} icon={Users} />
        <GroupChart title="Por sistema" items={bySystem} icon={Server} />
        <GroupChart title="Por estado" items={byStatus} icon={BarChart3} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-black text-slate-900">Checklist</h3>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {summary.checklistDone}/{summary.checklistTotal} items completados
          </p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-4xl font-black text-slate-950">{summary.checklistPct}%</span>
            <span className="pb-1 text-xs font-bold uppercase text-slate-400">cumplimiento</span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${summary.checklistPct}%` }}
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="text-sm font-black text-slate-900">Tareas críticas visibles</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {tasks
              .filter(
                (task) =>
                  isTaskOverdue(task) ||
                  getOperationalState(task) === "blocked" ||
                  isUrgentTask(task),
              )
              .slice(0, 10)
              .map((task) => {
                const op = operationalStates[getOperationalState(task)] || operationalStates.normal;
                const Op = op.icon;
                return (
                  <button
                    key={task.id}
                    onClick={() => onSelect?.(task)}
                    className="grid w-full grid-cols-[1fr_120px_120px_120px] gap-3 px-4 py-3 text-left text-xs hover:bg-slate-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-black text-slate-900">{task.title}</span>
                      <span className="mt-0.5 flex items-center gap-1 truncate font-semibold text-slate-400">
                        <Op className="h-3.5 w-3.5" />
                        {op.label}
                      </span>
                    </span>
                    <span className="truncate font-semibold text-slate-600">
                      {displayPersonName(task.assignedName) || "Sin asignar"}
                    </span>
                    <span className="truncate font-semibold text-slate-600">
                      {task.system || "Sin sistema"}
                    </span>
                    <span
                      className={`font-black ${isTaskOverdue(task) ? "text-red-600" : "text-slate-500"}`}
                    >
                      {task.dueDate || "Sin fecha"}
                    </span>
                  </button>
                );
              })}
            {tasks.length === 0 && (
              <p className="px-4 py-10 text-center text-sm font-semibold text-slate-400">
                Este board no tiene tareas para reportar.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
