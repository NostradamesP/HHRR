import React, { useMemo, useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const initialTasks = [
  { id: 1, phase: "V1", module: "Producto", title: "Definir visión del producto", priority: "Alta", status: "Pendiente", effort: "Medio" },
  { id: 2, phase: "V1", module: "Arquitectura", title: "Elegir stack definitivo", priority: "Alta", status: "Pendiente", effort: "Medio" },
  { id: 3, phase: "V1", module: "Seguridad", title: "Definir modelo de permisos", priority: "Alta", status: "Pendiente", effort: "Alto" },
  { id: 4, phase: "V1", module: "Infraestructura", title: "Crear monorepo inicial", priority: "Alta", status: "Pendiente", effort: "Bajo" },
  { id: 5, phase: "V1", module: "Diseño", title: "Crear prototipo Figma", priority: "Alta", status: "Pendiente", effort: "Alto" },
  { id: 6, phase: "V2", module: "Auth", title: "Login seguro", priority: "Alta", status: "Pendiente", effort: "Alto" },
  { id: 7, phase: "V2", module: "Auth", title: "MFA para administradores", priority: "Alta", status: "Pendiente", effort: "Medio" },
  { id: 8, phase: "V2", module: "Empresas", title: "Multi-tenant por company_id", priority: "Alta", status: "Pendiente", effort: "Alto" },
  { id: 9, phase: "V2", module: "Auditoría", title: "Audit logs base", priority: "Alta", status: "Pendiente", effort: "Medio" },
  { id: 10, phase: "V3", module: "Empleados", title: "CRUD de empleados", priority: "Alta", status: "Pendiente", effort: "Alto" },
  { id: 11, phase: "V3", module: "Flutter", title: "Dashboard de empleado", priority: "Alta", status: "Pendiente", effort: "Medio" },
  { id: 12, phase: "V3", module: "Solicitudes", title: "Solicitudes de vacaciones", priority: "Alta", status: "Pendiente", effort: "Alto" },
  { id: 13, phase: "V3", module: "Solicitudes", title: "Licencias y permisos", priority: "Media", status: "Pendiente", effort: "Alto" },
  { id: 14, phase: "V4", module: "Documentos", title: "Storage privado de documentos", priority: "Alta", status: "Pendiente", effort: "Alto" },
  { id: 15, phase: "V4", module: "Documentos", title: "Generador de cartas laborales", priority: "Media", status: "Pendiente", effort: "Medio" },
  { id: 16, phase: "V5", module: "Reportes", title: "Dashboard RRHH", priority: "Alta", status: "Pendiente", effort: "Alto" },
  { id: 17, phase: "V5", module: "Notificaciones", title: "Notificaciones push/email", priority: "Media", status: "Pendiente", effort: "Medio" },
  { id: 18, phase: "V6", module: "Nómina", title: "Períodos de nómina", priority: "Media", status: "Pendiente", effort: "Alto" },
  { id: 19, phase: "V6", module: "Nómina", title: "Recibos de pago PDF", priority: "Media", status: "Pendiente", effort: "Medio" },
  { id: 20, phase: "V7", module: "Compliance RD", title: "Research TSS/DGII/DGT", priority: "Alta", status: "Pendiente", effort: "Alto" },
  { id: 21, phase: "V8", module: "BI", title: "Métricas de ausentismo y headcount", priority: "Baja", status: "Pendiente", effort: "Medio" },
  { id: 22, phase: "V8", module: "IA", title: "Asistente de RRHH futuro", priority: "Baja", status: "Pendiente", effort: "Alto" },
];

const statuses = ["Pendiente", "En progreso", "Bloqueado", "Hecho"];

const phaseMap = { V1: "Fundación", V2: "Auth y empresas", V3: "RRHH Self-Service", V4: "Documentos", V5: "Dashboard Admin", V6: "Payroll Lite", V7: "Cumplimiento RD", V8: "BI + IA" };

const modules = ["Producto", "Arquitectura", "Seguridad", "Infraestructura", "Diseño", "Auth", "Empresas", "Auditoría", "Empleados", "Flutter", "Solicitudes", "Documentos", "Reportes", "Notificaciones", "Nómina", "Compliance RD", "BI", "IA"];

const effortWeight = { Alto: 3, Medio: 2, Bajo: 1 };
const statusScore = { "Bloqueado": 0, "Pendiente": 1, "En progreso": 2, "Hecho": 3 };

function loadTasks() { try { const saved = localStorage.getItem("nt"); return saved ? JSON.parse(saved) : initialTasks; } catch { return initialTasks; } }
function saveTasks(t) { try { localStorage.setItem("nt", JSON.stringify(t)); } catch {} }

function filterTasks(tasks, q, mod, prio) {
  const cq = q.trim().toLowerCase();
  return tasks.filter(t => {
    const st = [t.title, t.module, t.phase, t.priority].join(" ").toLowerCase();
    return (cq === "" || st.includes(cq)) && (mod === "Todos" || t.module === mod) && (prio === "Todas" || t.priority === prio);
  });
}

function PriorityDot({ p }) {
  const c = p === "Alta" ? "bg-red-500" : p === "Media" ? "bg-amber-500" : "bg-slate-400";
  return <span className={`inline-block h-2 w-2 rounded-full ${c}`} />;
}

function Card({ t, onStatus, onDelete, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: t.id });
  const s = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={s} {...attributes} {...listeners} className={`group rounded-xl border bg-white p-3.5 shadow-sm transition-all ${isDragging ? "shadow-lg ring-2 ring-blue-400 z-10" : "hover:shadow-md hover:-translate-y-0.5"}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <PriorityDot p={t.priority} />
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{t.module}</span>
        </div>
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={(e) => { e.stopPropagation(); onEdit(t); }} className="rounded-lg px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">✎</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(t.id); }} className="rounded-lg px-1.5 py-0.5 text-xs text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">✕</button>
        </div>
      </div>
      <h3 className="text-sm font-semibold leading-snug text-slate-900">{t.title}</h3>
      <div className="mt-2 flex items-center gap-2">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{t.phase} · {phaseMap[t.phase]}</span>
        <span className="text-[11px] text-slate-400">{t.effort}</span>
      </div>
      <div className="mt-3 flex gap-1">
        {statuses.filter(s => s !== t.status).map(s => (
          <button key={s} onClick={(e) => { e.stopPropagation(); onStatus(t.id, s); }} className="rounded-md border px-2 py-0.5 text-[10px] font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">{s}</button>
        ))}
      </div>
    </div>
  );
}

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function TaskForm({ onSave, onClose, initial }) {
  const [f, setF] = useState(initial || { title: "", module: modules[0], phase: "V1", priority: "Media", effort: "Medio" });
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">{initial ? "Editar tarea" : "Nueva tarea"}</h2>
      <input placeholder="Título" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-blue-500" autoFocus />
      <div className="grid grid-cols-2 gap-3">
        <select value={f.module} onChange={e => setF({ ...f, module: e.target.value })} className="rounded-xl border px-3 py-2.5 text-sm outline-none">{modules.map(m => <option key={m} value={m}>{m}</option>)}</select>
        <select value={f.phase} onChange={e => setF({ ...f, phase: e.target.value })} className="rounded-xl border px-3 py-2.5 text-sm outline-none">{Object.entries(phaseMap).map(([k, v]) => <option key={k} value={k}>{k} - {v}</option>)}</select>
        <select value={f.priority} onChange={e => setF({ ...f, priority: e.target.value })} className="rounded-xl border px-3 py-2.5 text-sm outline-none"><option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option></select>
        <select value={f.effort} onChange={e => setF({ ...f, effort: e.target.value })} className="rounded-xl border px-3 py-2.5 text-sm outline-none"><option value="Alto">Alto</option><option value="Medio">Medio</option><option value="Bajo">Bajo</option></select>
      </div>
      <div className="flex gap-3 pt-1">
        <button onClick={() => f.title && onSave({ ...f, id: initial?.id || Date.now() })} disabled={!f.title} className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition-colors">{initial ? "Actualizar" : "Agregar"}</button>
        <button onClick={onClose} className="flex-1 rounded-xl border py-2.5 text-sm font-semibold hover:bg-slate-50 transition-colors">Cancelar</button>
      </div>
    </div>
  );
}

export default function NoraHRKanban() {
  const [tasks, setTasks] = useState(loadTasks);
  const [query, setQuery] = useState("");
  const [mod, setMod] = useState("Todos");
  const [prio, setPrio] = useState("Todas");
  const [showAdd, setShowAdd] = useState(false);
  const [editT, setEditT] = useState(null);

  useEffect(() => saveTasks(tasks), [tasks]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const filtered = useMemo(() => filterTasks(tasks, query, mod, prio), [tasks, query, mod, prio]);
  const grouped = useMemo(() => statuses.map(s => ({ status: s, items: filtered.filter(t => t.status === s) })), [filtered]);

  const done = tasks.filter(t => t.status === "Hecho").length;
  const progress = Math.round((done / tasks.length) * 100);
  const effortDone = tasks.filter(t => t.status === "Hecho").reduce((a, t) => a + (effortWeight[t.effort] || 0), 0);
  const effortTotal = tasks.reduce((a, t) => a + (effortWeight[t.effort] || 0), 0);

  function handleDrag(e) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setTasks(items => {
      const oldIdx = items.findIndex(t => t.id === active.id);
      const newIdx = items.findIndex(t => t.id === over.id);
      const moved = [...items];
      const [removed] = moved.splice(oldIdx, 1);
      moved.splice(newIdx, 0, removed);
      return moved;
    });
  }

  function updateStatus(id, s) { setTasks(ts => ts.map(t => t.id === id ? { ...t, status: s } : t)); }
  function deleteTask(id) { if (confirm("¿Eliminar esta tarea?")) setTasks(ts => ts.filter(t => t.id !== id)); }
  function addTask(f) { setTasks(ts => [...ts, { ...f, status: "Pendiente" }]); setShowAdd(false); }
  function editTask(f) { setTasks(ts => ts.map(t => t.id === f.id ? f : t)); setEditT(null); }

  function exportCSV() {
    const headers = "Título,Módulo,Fase,Prioridad,Esfuerzo,Estado\n";
    const rows = tasks.map(t => `"${t.title}","${t.module}","${t.phase} - ${phaseMap[t.phase]}","${t.priority}","${t.effort}","${t.status}"`).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "norahr-tasks.csv"; a.click();
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDrag}>
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">NoraHR Roadmap</h1>
              <p className="text-sm text-slate-400">{tasks.length} tareas · {done} completadas · {progress}% done · {Math.round((effortDone / effortTotal) * 100)}% effort</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={exportCSV} className="rounded-xl border bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Export</button>
              <button onClick={() => setShowAdd(true)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors">+ Tarea</button>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar tarea..." className="min-w-[200px] rounded-xl border bg-white px-4 py-2 text-sm outline-none focus:border-slate-400" />
            <select value={mod} onChange={e => setMod(e.target.value)} className="rounded-xl border bg-white px-4 py-2 text-sm outline-none">
              <option value="Todos">Todos módulos</option>{modules.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={prio} onChange={e => setPrio(e.target.value)} className="rounded-xl border bg-white px-4 py-2 text-sm outline-none">
              <option value="Todas">Todas prioridades</option><option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {grouped.map(({ status, items }) => {
              const progressCol = status === "Hecho" ? "text-emerald-600 bg-emerald-50" : status === "En progreso" ? "text-blue-600 bg-blue-50" : status === "Bloqueado" ? "text-rose-600 bg-rose-50" : "text-slate-600 bg-slate-100";
              const borderCol = status === "Hecho" ? "border-emerald-200" : status === "En progreso" ? "border-blue-200" : status === "Bloqueado" ? "border-rose-200" : "border-slate-200";
              return (
                <div key={status} className={`rounded-2xl border bg-white/60 p-4 ${borderCol}`}>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{status === "Hecho" ? "✅" : status === "En progreso" ? "⏳" : status === "Bloqueado" ? "⚠️" : "○"}</span>
                      <h2 className="font-semibold text-slate-900">{status}</h2>
                    </div>
                    <span className={`rounded-lg px-2.5 py-0.5 text-xs font-semibold ${progressCol}`}>{items.length}</span>
                  </div>
                  <SortableContext items={items.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {items.map(t => <Card key={t.id} t={t} onStatus={updateStatus} onDelete={deleteTask} onEdit={setEditT} />)}
                      {items.length === 0 && <div className="rounded-xl border-2 border-dashed p-6 text-center text-sm text-slate-300">Arrastra tareas aquí</div>}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)}>
        <TaskForm onSave={addTask} onClose={() => setShowAdd(false)} />
      </Modal>
      <Modal open={!!editT} onClose={() => setEditT(null)}>
        {editT && <TaskForm onSave={editTask} onClose={() => setEditT(null)} initial={editT} />}
      </Modal>
    </DndContext>
  );
}