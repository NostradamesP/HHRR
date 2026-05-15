import React, { useMemo, useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const initialTasks = [
  { id: 1, phase: "V1 - Fundación", module: "Producto", title: "Definir visión del producto", description: "Documento corto explicando qué es NoraHR, para quién es y qué problema resuelve mejor que SPN.", priority: "Alta", status: "Pendiente", sprint: "Sprint 0", owner: "Eduardo", effort: "Medio" },
  { id: 2, phase: "V1 - Fundación", module: "Arquitectura", title: "Elegir stack definitivo", description: "Confirmar Flutter + NestJS/FastAPI + PostgreSQL + Docker + storage privado.", priority: "Alta", status: "Pendiente", sprint: "Sprint 0", owner: "Eduardo", effort: "Medio" },
  { id: 3, phase: "V1 - Fundación", module: "Seguridad", title: "Definir modelo de permisos", description: "Crear roles: Super Admin, Empresa Admin, RRHH, Supervisor, Empleado, Nómina y Auditor.", priority: "Alta", status: "Pendiente", sprint: "Sprint 0", owner: "Eduardo", effort: "Alto" },
  { id: 4, phase: "V1 - Fundación", module: "Infraestructura", title: "Crear monorepo inicial", description: "Estructura apps/mobile, apps/admin, backend, docs e infra.", priority: "Alta", status: "Pendiente", sprint: "Sprint 1", owner: "Eduardo", effort: "Bajo" },
  { id: 5, phase: "V1 - Fundación", module: "Diseño", title: "Crear prototipo Figma", description: "Diseñar login, dashboard empleado, solicitudes, documentos, empleados y panel RRHH.", priority: "Alta", status: "Pendiente", sprint: "Sprint 1", owner: "Eduardo", effort: "Alto" },
  { id: 6, phase: "V2 - Auth y empresas", module: "Auth", title: "Login seguro", description: "Implementar login con access token corto, refresh token rotativo y cierre de sesión.", priority: "Alta", status: "Pendiente", sprint: "Sprint 2", owner: "Eduardo", effort: "Alto" },
  { id: 7, phase: "V2 - Auth y empresas", module: "Auth", title: "MFA para administradores", description: "Agregar segundo factor para RRHH, Empresa Admin y Super Admin.", priority: "Alta", status: "Pendiente", sprint: "Sprint 2", owner: "Eduardo", effort: "Medio" },
  { id: 8, phase: "V2 - Auth y empresas", module: "Empresas", title: "Multi-tenant por company_id", description: "Todas las tablas sensibles deben separar datos por empresa desde el backend.", priority: "Alta", status: "Pendiente", sprint: "Sprint 2", owner: "Eduardo", effort: "Alto" },
  { id: 9, phase: "V2 - Auth y empresas", module: "Auditoría", title: "Audit logs base", description: "Registrar login, cambios de permisos, creación de usuarios y acciones críticas.", priority: "Alta", status: "Pendiente", sprint: "Sprint 2", owner: "Eduardo", effort: "Medio" },
  { id: 10, phase: "V3 - RRHH Self-Service", module: "Empleados", title: "CRUD de empleados", description: "Crear, editar, activar/desactivar empleados, departamentos, posiciones y datos básicos.", priority: "Alta", status: "Pendiente", sprint: "Sprint 3", owner: "Eduardo", effort: "Alto" },
  { id: 11, phase: "V3 - RRHH Self-Service", module: "Flutter", title: "Dashboard de empleado", description: "Pantalla con perfil, solicitudes, documentos, notificaciones y próximos eventos.", priority: "Alta", status: "Pendiente", sprint: "Sprint 3", owner: "Eduardo", effort: "Medio" },
  { id: 12, phase: "V3 - RRHH Self-Service", module: "Solicitudes", title: "Solicitudes de vacaciones", description: "Empleado solicita vacaciones, supervisor aprueba/rechaza y RRHH puede auditar.", priority: "Alta", status: "Pendiente", sprint: "Sprint 4", owner: "Eduardo", effort: "Alto" },
  { id: 13, phase: "V3 - RRHH Self-Service", module: "Solicitudes", title: "Licencias y permisos", description: "Flujo para licencia médica, permiso personal, ausencia y cambio de datos.", priority: "Media", status: "Pendiente", sprint: "Sprint 4", owner: "Eduardo", effort: "Alto" },
  { id: 14, phase: "V4 - Documentos", module: "Documentos", title: "Storage privado de documentos", description: "Subir documentos con permisos, URLs firmadas, expiración y logs de descarga.", priority: "Alta", status: "Pendiente", sprint: "Sprint 5", owner: "Eduardo", effort: "Alto" },
  { id: 15, phase: "V4 - Documentos", module: "Documentos", title: "Generador de cartas laborales", description: "Plantillas PDF para carta laboral, certificación salarial y constancia de empleo.", priority: "Media", status: "Pendiente", sprint: "Sprint 5", owner: "Eduardo", effort: "Medio" },
  { id: 16, phase: "V5 - Dashboard Admin", module: "Reportes", title: "Dashboard RRHH", description: "Mostrar empleados activos, solicitudes pendientes, ausencias, documentos y actividad reciente.", priority: "Alta", status: "Pendiente", sprint: "Sprint 6", owner: "Eduardo", effort: "Alto" },
  { id: 17, phase: "V5 - Dashboard Admin", module: "Notificaciones", title: "Notificaciones push/email", description: "Enviar alertas para aprobaciones, documentos, cambios de estado y tareas pendientes.", priority: "Media", status: "Pendiente", sprint: "Sprint 6", owner: "Eduardo", effort: "Medio" },
  { id: 18, phase: "V6 - Payroll Lite", module: "Nómina", title: "Períodos de nómina", description: "Crear períodos, asignar empleados, ingresos, deducciones y cálculo neto inicial.", priority: "Media", status: "Pendiente", sprint: "Sprint 7", owner: "Eduardo", effort: "Alto" },
  { id: 19, phase: "V6 - Payroll Lite", module: "Nómina", title: "Recibos de pago PDF", description: "Generar recibo de pago consultable desde app empleado y auditable por RRHH.", priority: "Media", status: "Pendiente", sprint: "Sprint 7", owner: "Eduardo", effort: "Medio" },
  { id: 20, phase: "V7 - Cumplimiento RD", module: "Compliance RD", title: "Research TSS/DGII/DGT", description: "Documentar cálculos, reportes, formatos y responsabilidades legales en República Dominicana.", priority: "Alta", status: "Pendiente", sprint: "Sprint 8", owner: "Eduardo", effort: "Alto" },
  { id: 21, phase: "V8 - BI + IA", module: "BI", title: "Métricas de ausentismo y headcount", description: "Crear gráficos por departamento, mes, tipo de ausencia y tendencia de empleados.", priority: "Baja", status: "Pendiente", sprint: "Sprint 9", owner: "Eduardo", effort: "Medio" },
  { id: 22, phase: "V8 - BI + IA", module: "IA", title: "Asistente de RRHH futuro", description: "Explorar IA para resumir solicitudes, generar cartas y detectar patrones de ausencias.", priority: "Baja", status: "Pendiente", sprint: "Sprint 10", owner: "Eduardo", effort: "Alto" },
];

const statusOptions = ["Pendiente", "En progreso", "Bloqueado", "Hecho"];
const priorityOptions = ["Todas", "Alta", "Media", "Baja"];
const phasesList = Object.keys({ "V1 - Fundación": 0, "V2 - Auth y empresas": 0, "V3 - RRHH Self-Service": 0, "V4 - Documentos": 0, "V5 - Dashboard Admin": 0, "V6 - Payroll Lite": 0, "V7 - Cumplimiento RD": 0, "V8 - BI + IA": 0 });
const modulesList = ["Producto", "Arquitectura", "Seguridad", "Infraestructura", "Diseño", "Auth", "Empresas", "Auditoría", "Empleados", "Flutter", "Solicitudes", "Documentos", "Reportes", "Notificaciones", "Nómina", "Compliance RD", "BI", "IA"];
const phaseIcons = { "V1 - Fundación": "🚀", "V2 - Auth y empresas": "🔐", "V3 - RRHH Self-Service": "👥", "V4 - Documentos": "📄", "V5 - Dashboard Admin": "📊", "V6 - Payroll Lite": "💳", "V7 - Cumplimiento RD": "🛡️", "V8 - BI + IA": "🤖" };

const viewOptions = ["Etapas", "Kanban", "Seguridad", "Stats", "Tests"];

function getUniqueValues(items, key) { return Array.from(new Set(items.map((item) => item[key]))); }

function filterTasks(tasks, query, selectedPhase, selectedModule, selectedPriority) {
  const cleanQuery = query.trim().toLowerCase();
  return tasks.filter((task) => {
    const searchableText = [task.title, task.description, task.module, task.phase, task.status, task.priority].join(" ").toLowerCase();
    return (cleanQuery === "" || searchableText.includes(cleanQuery)) && (selectedPhase === "Todas" || task.phase === selectedPhase) && (selectedModule === "Todos" || task.module === selectedModule) && (selectedPriority === "Todas" || task.priority === selectedPriority);
  });
}

function groupBy(items, key) {
  return items.reduce((groups, item) => {
    const groupKey = item[key];
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(item);
    return groups;
  }, {});
}

function calculateProgress(tasks) {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((task) => task.status === "Hecho").length / tasks.length) * 100);
}

function runSelfTests() {
  const sampleTasks = [
    { id: 1, title: "Login seguro", description: "JWT", module: "Auth", phase: "V1", priority: "Alta", status: "Pendiente" },
    { id: 2, title: "Dashboard", description: "RRHH", module: "Reportes", phase: "V2", priority: "Media", status: "Hecho" },
    { id: 3, title: "MFA", description: "Admins", module: "Auth", phase: "V1", priority: "Alta", status: "Hecho" },
  ];
  return [
    { name: "Filtra por búsqueda", pass: filterTasks(sampleTasks, "login", "Todas", "Todos", "Todas").length === 1 },
    { name: "Filtra por módulo", pass: filterTasks(sampleTasks, "", "Todas", "Auth", "Todas").length === 2 },
    { name: "Filtra por prioridad", pass: filterTasks(sampleTasks, "", "Todas", "Todos", "Alta").length === 2 },
    { name: "Agrupa por fase", pass: Object.keys(groupBy(sampleTasks, "phase")).length === 2 },
    { name: "Calcula progreso correctamente", pass: calculateProgress(sampleTasks) === 67 },
    { name: "No rompe con lista vacía", pass: calculateProgress([]) === 0 },
  ];
}

function getPriorityStyle(priority) { return priority === "Alta" ? "border-red-200 bg-red-50 text-red-700" : priority === "Media" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-100 text-slate-700"; }
function getStatusStyle(status) { if (status === "Hecho") return "border-emerald-200 bg-emerald-50 text-emerald-700"; if (status === "En progreso") return "border-blue-200 bg-blue-50 text-blue-700"; if (status === "Bloqueado") return "border-rose-200 bg-rose-50 text-rose-700"; return "border-slate-200 bg-slate-100 text-slate-700"; }
function getStatusIcon(status) { if (status === "Hecho") return "✅"; if (status === "En progreso") return "⏳"; if (status === "Bloqueado") return "⚠️"; return "○"; }

function Badge({ children, className = "" }) { return <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>{children}</span>; }
function Card({ children, className = "" }) { return <div className={`rounded-3xl border shadow-sm ${className}`}>{children}</div>; }
function ProgressBar({ value }) { return <div className="h-2 w-full overflow-hidden rounded-full"><div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>; }
function StatCard({ icon, label, value, darkMode }) { return <Card className="p-5"><div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl">{icon}</div><div><p className="text-sm opacity-60">{label}</p><p className="text-2xl font-bold">{value}</p></div></div></Card>; }

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">{children}</div>
    </div>
  );
}

function TaskForm({ onSave, onClose }) {
  const [form, setForm] = useState({ title: "", description: "", phase: "V1 - Fundación", module: "Producto", priority: "Media", sprint: "Sprint 0", owner: "Eduardo", effort: "Medio" });
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Nueva Tarea</h2>
      <input placeholder="Título *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border p-3 outline-none focus:border-blue-500" />
      <textarea placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border p-3 outline-none focus:border-blue-500" rows={3} />
      <div className="grid grid-cols-2 gap-3">
        <select value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })} className="rounded-xl border p-2">{phasesList.map(p => <option key={p} value={p}>{p}</option>)}</select>
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="rounded-xl border p-2"><option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option></select>
        <select value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} className="rounded-xl border p-2">{modulesList.map(m => <option key={m} value={m}>{m}</option>)}</select>
        <input placeholder="Sprint" value={form.sprint} onChange={(e) => setForm({ ...form, sprint: e.target.value })} className="rounded-xl border p-2" />
      </div>
      <div className="flex gap-3">
        <button onClick={() => form.title && onSave(form)} className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50" disabled={!form.title}>Guardar</button>
        <button onClick={onClose} className="flex-1 rounded-xl border py-3 font-semibold hover:bg-gray-50">Cancelar</button>
      </div>
    </div>
  );
}

function EditForm({ task, onSave, onClose, darkMode }) {
  const [form, setForm] = useState(task);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Editar Tarea</h2>
      <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`w-full rounded-xl border p-3 outline-none ${darkMode ? "bg-slate-700 border-slate-600" : ""}`} />
      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`w-full rounded-xl border p-3 outline-none ${darkMode ? "bg-slate-700 border-slate-600" : ""}`} rows={3} />
      <div className="grid grid-cols-2 gap-3">
        <select value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })} className={`rounded-xl border p-2 ${darkMode ? "bg-slate-700 border-slate-600" : ""}`}>{phasesList.map(p => <option key={p} value={p}>{p}</option>)}</select>
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={`rounded-xl border p-2 ${darkMode ? "bg-slate-700 border-slate-600" : ""}`}><option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option></select>
        <select value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} className={`rounded-xl border p-2 ${darkMode ? "bg-slate-700 border-slate-600" : ""}`}>{modulesList.map(m => <option key={m} value={m}>{m}</option>)}</select>
        <input value={form.sprint} onChange={(e) => setForm({ ...form, sprint: e.target.value })} className={`rounded-xl border p-2 ${darkMode ? "bg-slate-700 border-slate-600" : ""}`} />
      </div>
      <div className="flex gap-3">
        <button onClick={() => onSave(form)} className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">Actualizar</button>
        <button onClick={onClose} className="flex-1 rounded-xl border py-3 font-semibold hover:bg-gray-50">Cancelar</button>
      </div>
    </div>
  );
}

function SortableTask({ task, onStatusChange, onDelete, onEdit, darkMode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`rounded-2xl border p-4 shadow-sm ${darkMode ? "border-slate-600 bg-slate-700" : "border-slate-200 bg-white"} ${isDragging ? "shadow-lg ring-2 ring-blue-500" : "hover:-translate-y-0.5 hover:shadow-md"}`}>
      <div className="mb-3 flex flex-wrap gap-2">
        <Badge className={getPriorityStyle(task.priority)}>{task.priority}</Badge>
        <Badge className={getStatusStyle(task.status)}>{getStatusIcon(task.status)} {task.status}</Badge>
        <Badge className={darkMode ? "border-slate-600 bg-slate-600 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-600"}>{task.sprint}</Badge>
      </div>
      <h3 className="font-bold leading-snug">{task.title}</h3>
      <p className="mt-2 text-sm leading-6 opacity-60">{task.description}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs opacity-60">
        <div><span className="font-semibold">Módulo:</span> {task.module}</div>
        <div><span className="font-semibold">Esfuerzo:</span> {task.effort || "N/A"}</div>
        <div><span className="font-semibold">Owner:</span> {task.owner || "N/A"}</div>
        <div><span className="font-semibold">Sprint:</span> {task.sprint}</div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {statusOptions.map((status) => (
            <button key={status} type="button" onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, status); }} className={`rounded-lg border px-2 py-1 text-xs font-semibold transition ${task.status === status ? "border-slate-900 bg-slate-900 text-white" : darkMode ? "border-slate-500 hover:bg-slate-600" : "hover:bg-gray-100"}`}>{status}</button>
          ))}
        </div>
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className={`rounded-lg border px-2 py-1 text-xs ${darkMode ? "border-slate-500 hover:bg-slate-600" : "border-slate-200 hover:bg-gray-100"}`}>✏️</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100">🗑️</button>
        </div>
      </div>
    </div>
  );
}

function CompactTask({ task, onStatusChange, onDelete, onEdit, darkMode }) {
  return (
    <div className={`rounded-2xl border p-3 shadow-sm ${darkMode ? "border-slate-600 bg-slate-700" : "border-slate-200 bg-white"} hover:-translate-y-0.5 hover:shadow-md cursor-grab`}>
      <div className="mb-2 flex flex-wrap gap-1">
        <Badge className={getPriorityStyle(task.priority)}>{task.priority}</Badge>
        <Badge className={getStatusStyle(task.status)}>{getStatusIcon(task.status)} {task.status}</Badge>
      </div>
      <h3 className="text-sm font-semibold leading-snug">{task.title}</h3>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-1">
        <select value={task.status} onChange={(e) => onStatusChange(task.id, e.target.value)} className={`rounded border px-2 py-1 text-xs ${darkMode ? "bg-slate-600 border-slate-500" : ""}`}>
          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex gap-1">
          <button onClick={() => onEdit(task)} className={`rounded border px-1.5 py-1 text-xs ${darkMode ? "border-slate-500" : "border-slate-200"}`}>✏️</button>
          <button onClick={() => onDelete(task.id)} className="rounded border border-red-200 bg-red-50 px-1.5 py-1 text-xs text-red-600">🗑️</button>
        </div>
      </div>
    </div>
  );
}

function StatsView({ tasks, darkMode }) {
  const byPriority = { Alta: tasks.filter(t => t.priority === "Alta").length, Media: tasks.filter(t => t.priority === "Media").length, Baja: tasks.filter(t => t.priority === "Baja").length };
  const byStatus = { Pendiente: tasks.filter(t => t.status === "Pendiente").length, "En progreso": tasks.filter(t => t.status === "En progreso").length, Bloqueado: tasks.filter(t => t.status === "Bloqueado").length, Hecho: tasks.filter(t => t.status === "Hecho").length };
  const byPhase = groupBy(tasks, "phase");

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className={`p-6 ${darkMode ? "bg-slate-800 border-slate-700" : ""}`}>
        <h3 className="mb-4 text-lg font-bold">📊 Por Prioridad</h3>
        <div className="space-y-3">
          {Object.entries(byPriority).map(([p, count]) => (
            <div key={p} className="flex items-center justify-between">
              <span className={getPriorityStyle(p).split(" ")[2]}>{p}</span>
              <div className="flex items-center gap-2">
                <div className={`h-3 w-full rounded-full ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                  <div className={`h-full rounded-full ${p === "Alta" ? "bg-red-500" : p === "Media" ? "bg-amber-500" : "bg-slate-400"}`} style={{ width: `${(count / tasks.length) * 100}%` }} />
                </div>
                <span className="text-sm font-bold">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className={`p-6 ${darkMode ? "bg-slate-800 border-slate-700" : ""}`}>
        <h3 className="mb-4 text-lg font-bold">📈 Por Estado</h3>
        <div className="space-y-3">
          {Object.entries(byStatus).map(([s, count]) => (
            <div key={s} className="flex items-center justify-between">
              <span>{getStatusIcon(s)} {s}</span>
              <div className="flex items-center gap-2">
                <div className={`h-3 w-24 rounded-full ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                  <div className={`h-full rounded-full ${s === "Hecho" ? "bg-emerald-500" : s === "En progreso" ? "bg-blue-500" : s === "Bloqueado" ? "bg-rose-500" : "bg-slate-400"}`} style={{ width: `${(count / tasks.length) * 100}%` }} />
                </div>
                <span className="text-sm font-bold">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className={`p-6 ${darkMode ? "bg-slate-800 border-slate-700" : ""}`}>
        <h3 className="mb-4 text-lg font-bold">🎯 Avance por Fase</h3>
        <div className="space-y-3">
          {Object.entries(byPhase).map(([phase, phaseTasks]) => {
            const done = phaseTasks.filter(t => t.status === "Hecho").length;
            const pct = Math.round((done / phaseTasks.length) * 100);
            return (
              <div key={phase} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{phaseIcons[phase]} {phase.split(" - ")[0]}</span>
                  <span>{done}/{phaseTasks.length}</span>
                </div>
                <div className={`h-2 w-full rounded-full ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export default function NoraHRRoadmap() {
  const [tasks, setTasks] = useState(() => { try { const saved = localStorage.getItem("norahr-tasks"); return saved ? JSON.parse(saved) : initialTasks; } catch { return initialTasks; } });
  const [darkMode, setDarkMode] = useState(() => { try { const saved = localStorage.getItem("norahr-dark"); return saved ? JSON.parse(saved) : false; } catch { return false; } });
  const [query, setQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("Todas");
  const [selectedModule, setSelectedModule] = useState("Todos");
  const [selectedPhase, setSelectedPhase] = useState("Todas");
  const [activeView, setActiveView] = useState("Etapas");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => { try { localStorage.setItem("norahr-tasks", JSON.stringify(tasks)); } catch {} }, [tasks]);
  useEffect(() => { try { localStorage.setItem("norahr-dark", JSON.stringify(darkMode)); } catch {} }, [darkMode]);

  const phases = useMemo(() => ["Todas", ...getUniqueValues(tasks, "phase")], [tasks]);
  const modules = useMemo(() => ["Todos", ...getUniqueValues(tasks, "module")], [tasks]);
  const filteredTasks = useMemo(() => filterTasks(tasks, query, selectedPhase, selectedModule, selectedPriority), [tasks, query, selectedPhase, selectedModule, selectedPriority]);
  const groupedByPhase = useMemo(() => groupBy(filteredTasks, "phase"), [filteredTasks]);
  const tests = useMemo(() => runSelfTests(), []);
  const doneCount = tasks.filter((task) => task.status === "Hecho").length;
  const inProgressCount = tasks.filter((task) => task.status === "En progreso").length;
  const blockedCount = tasks.filter((task) => task.status === "Bloqueado").length;
  const progress = calculateProgress(tasks);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((t) => t.id === active.id);
        const newIndex = items.findIndex((t) => t.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateStatus = (id, nextStatus) => { setTasks((currentTasks) => currentTasks.map((task) => (task.id === id ? { ...task, status: nextStatus } : task))); };
  const deleteTask = (id) => { if (confirm("¿Eliminar esta tarea?")) setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id)); };
  const addTask = (form) => { const newTask = { ...form, id: Date.now(), status: "Pendiente", owner: "Eduardo", effort: "Medio" }; setTasks((currentTasks) => [...currentTasks, newTask]); setShowAddModal(false); };
  const editTask = (form) => { setTasks((currentTasks) => currentTasks.map((t) => (t.id === form.id ? form : t))); setEditingTask(null); };
  const resetFilters = () => { setQuery(""); setSelectedPriority("Todas"); setSelectedModule("Todos"); setSelectedPhase("Todas"); };

  const bg = darkMode ? "bg-slate-900" : "bg-slate-50";
  const text = darkMode ? "text-white" : "text-slate-950";
  const cardBg = darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200";
  const inputBg = darkMode ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "bg-white border-slate-200";
  const headerBg = darkMode ? "bg-slate-800" : "bg-slate-950";
  const progressBar = darkMode ? "bg-slate-700" : "bg-white/20";
  const progressFill = darkMode ? "bg-blue-500" : "bg-white";

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className={`min-h-screen p-4 md:p-8 ${bg} ${text} transition-colors`}>
        <div className="mx-auto max-w-7xl space-y-6">
          <section className={`overflow-hidden rounded-3xl ${headerBg} p-6 text-white shadow-xl md:p-8`}>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl space-y-3">
                <div className="flex items-center gap-4 text-sm text-slate-300">
                  <span>📱 Flutter-first · ☁️ Cloud-first · 🔐 Security-first</span>
                  <button onClick={() => setDarkMode(!darkMode)} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold hover:bg-white/20 transition">{darkMode ? "☀️" : "🌙"}</button>
                </div>
                <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Roadmap Interactivo NoraHR</h1>
                <p className="text-base leading-7 text-slate-300 md:text-lg">Plan por etapas para construir una plataforma moderna de RRHH, autoservicio, documentos, solicitudes, nómina ligera, cumplimiento RD y BI.</p>
              </div>
              <div className={`w-full rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur md:w-80 ${darkMode ? "bg-white/5" : ""}`}>
                <div className="text-sm text-slate-300">Progreso general</div>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-4xl font-bold">{progress}%</span>
                  <span className="pb-1 text-sm text-slate-300">{doneCount}/{tasks.length} tareas</span>
                </div>
                <div className="mt-3"><div className={`h-2 w-full overflow-hidden rounded-full ${progressBar}`}><div className={`h-full rounded-full transition-all duration-500 ${progressFill}`} style={{ width: `${progress}%` }} /></div></div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <StatCard icon="🗂️" label="Total tareas" value={tasks.length} darkMode={darkMode} />
            <StatCard icon="⏳" label="En progreso" value={inProgressCount} darkMode={darkMode} />
            <StatCard icon="⚠️" label="Bloqueadas" value={blockedCount} darkMode={darkMode} />
            <StatCard icon="✅" label="Hechas" value={doneCount} darkMode={darkMode} />
          </section>

          <Card className={`p-5 ${cardBg}`}>
            <div className="mb-4 flex justify-end">
              <button onClick={() => setShowAddModal(true)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">+ Agregar Tarea</button>
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              <input type="search" placeholder="Buscar tarea..." value={query} onChange={(e) => setQuery(e.target.value)} className={`rounded-2xl border px-4 py-3 text-sm outline-none md:col-span-2 ${inputBg}`} />
              <select value={selectedPhase} onChange={(e) => setSelectedPhase(e.target.value)} className={`rounded-2xl border px-4 py-3 text-sm outline-none ${inputBg}`}>{phases.map((phase) => <option key={phase} value={phase}>{phase}</option>)}</select>
              <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)} className={`rounded-2xl border px-4 py-3 text-sm outline-none ${inputBg}`}>{modules.map((module) => <option key={module} value={module}>{module}</option>)}</select>
              <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)} className={`rounded-2xl border px-4 py-3 text-sm outline-none ${inputBg}`}>{priorityOptions.map((p) => <option key={p} value={p}>{p}</option>)}</select>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm opacity-60">Mostrando {filteredTasks.length} de {tasks.length} tareas. Drag to reorder.</p>
              <button type="button" onClick={resetFilters} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${darkMode ? "border-slate-600 hover:bg-slate-700" : "hover:bg-slate-50"}`}>Limpiar filtros</button>
            </div>
          </Card>

          <nav className="flex flex-wrap gap-2 rounded-3xl p-2 md:w-fit" style={{ background: darkMode ? "#1e293b" : "#e2e8f0" }}>
            {viewOptions.map((view) => (
              <button key={view} type="button" onClick={() => setActiveView(view)} className={`rounded-2xl px-5 py-2 text-sm font-semibold transition ${activeView === view ? `bg-white shadow-sm ${text}` : darkMode ? "text-slate-400 hover:bg-slate-700" : "text-slate-600 hover:bg-white/60"}`}>{view}</button>
            ))}
          </nav>

          {activeView === "Etapas" && (
            <section className="space-y-5">
              {Object.entries(groupedByPhase).map(([phase, phaseTasks]) => {
                const phaseProgress = calculateProgress(phaseTasks);
                const phaseDone = phaseTasks.filter((task) => task.status === "Hecho").length;
                return (
                  <Card key={phase} className={`p-5 md:p-6 ${cardBg}`}>
                    <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl text-white" style={{ background: darkMode ? "#3b82f6" : "#0f172a" }}>{phaseIcons[phase] || "🚀"}</div>
                        <div><h2 className="text-xl font-bold">{phase}</h2><p className="text-sm opacity-60">{phaseDone}/{phaseTasks.length} completadas</p></div>
                      </div>
                      <div className="w-full md:w-72">
                        <div className="mb-1 flex justify-between text-xs opacity-60"><span>Progreso</span><span>{phaseProgress}%</span></div>
                        <ProgressBar value={phaseProgress} />
                      </div>
                    </div>
                    <SortableContext items={phaseTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {phaseTasks.map((task) => <SortableTask key={task.id} task={task} onStatusChange={updateStatus} onDelete={deleteTask} onEdit={setEditingTask} darkMode={darkMode} />)}
                      </div>
                    </SortableContext>
                  </Card>
                );
              })}
            </section>
          )}

          {activeView === "Kanban" && (
            <section className="grid gap-4 md:grid-cols-4">
              {statusOptions.map((status) => {
                const statusTasks = filteredTasks.filter((task) => task.status === status);
                return (
                  <Card key={status} className={`p-4 ${cardBg}`}>
                    <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">{getStatusIcon(status)} {status}</h2><Badge className={darkMode ? "bg-slate-700 border-slate-600" : "border-slate-200 bg-slate-50"}>{statusTasks.length}</Badge></div>
                    <div className="space-y-3">
                      <SortableContext items={statusTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                        {statusTasks.map((task) => <CompactTask key={task.id} task={task} onStatusChange={updateStatus} onDelete={deleteTask} onEdit={setEditingTask} darkMode={darkMode} />)}
                      </SortableContext>
                      {statusTasks.length === 0 && <div className="rounded-2xl border border-dashed p-4 text-center text-sm opacity-40">No hay tareas aquí.</div>}
                    </div>
                  </Card>
                );
              })}
            </section>
          )}

          {activeView === "Seguridad" && (
            <section className="grid gap-4 md:grid-cols-3">
              {[{ title: "Backend primero", icon: "🔐", items: ["Permisos validados en API", "JWT corto + refresh token", "MFA para admins", "Rate limiting"] }, { title: "Datos sensibles", icon: "🛡️", items: ["Storage privado", "URLs firmadas", "Cifrado en tránsito", "Backups cifrados"] }, { title: "Auditoría", icon: "📄", items: ["Cambios de salario", "Descargas", "Aprobaciones", "Cambios de permisos"] }].map((section) => (
                <Card key={section.title} className={`p-6 ${cardBg}`}>
                  <div className="mb-4 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl text-white" style={{ background: darkMode ? "#3b82f6" : "#0f172a" }}>{section.icon}</div><h3 className="text-lg font-bold">{section.title}</h3></div>
                  <div className="space-y-2">{section.items.map((item) => <div key={item} className={`rounded-2xl p-3 text-sm ${darkMode ? "bg-slate-700" : "bg-slate-100"}`}>✅ {item}</div>)}</div>
                </Card>
              ))}
            </section>
          )}

          {activeView === "Stats" && <StatsView tasks={filteredTasks} darkMode={darkMode} />}

          {activeView === "Tests" && (
            <Card className={`p-6 ${cardBg}`}>
              <div className="mb-5"><h2 className="text-xl font-bold">Pruebas internas del roadmap</h2><p className="mt-1 text-sm opacity-60">Validan las funciones de filtrado, agrupación y progreso.</p></div>
              <div className="space-y-3">
                {tests.map((test) => (
                  <div key={test.name} className={`flex items-center justify-between rounded-2xl border p-4 ${test.pass ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
                    <span className="font-semibold">{test.name}</span>
                    <Badge className={test.pass ? "border-emerald-200 text-emerald-700" : "border-rose-200 text-rose-700"}>{test.pass ? "PASS" : "FAIL"}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <TaskForm onSave={addTask} onClose={() => setShowAddModal(false)} />
      </Modal>

      <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)}>
        {editingTask && <EditForm task={editingTask} onSave={editTask} onClose={() => setEditingTask(null)} darkMode={darkMode} />}
      </Modal>
    </DndContext>
  );
}