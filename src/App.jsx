import React, { Component, useMemo, useState, useEffect, useRef } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { collection, onSnapshot, query, orderBy, where, limit, addDoc, updateDoc, deleteDoc, doc, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import { useBoard } from "./BoardContext";
import Sidebar from "./Sidebar";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <p className="text-sm text-red-500 mb-2">Error al mostrar el modal</p>
          <button onClick={() => this.setState({ hasError: false })} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors">
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const initialTasks = [
  { id: 1, phase: "V1", module: "Producto", title: "Definir visión del producto", description: "Documento corto explicando qué es NoraHR, para quién es y qué problema resuelve mejor que SPN.", priority: "Alta", status: "Pendiente", effort: "Medio" },
  { id: 2, phase: "V1", module: "Arquitectura", title: "Elegir stack definitivo", description: "Confirmar Flutter + NestJS/FastAPI + PostgreSQL + Docker + storage privado.", priority: "Alta", status: "Pendiente", effort: "Medio" },
  { id: 3, phase: "V1", module: "Seguridad", title: "Definir modelo de permisos", description: "Crear roles: Super Admin, Empresa Admin, RRHH, Supervisor, Empleado, Nómina y Auditor.", priority: "Alta", status: "Pendiente", effort: "Alto" },
  { id: 4, phase: "V1", module: "Infraestructura", title: "Crear monorepo inicial", description: "Estructura apps/mobile, apps/admin, backend, docs e infra.", priority: "Alta", status: "Pendiente", effort: "Bajo" },
  { id: 5, phase: "V1", module: "Diseño", title: "Crear prototipo Figma", description: "Diseñar login, dashboard empleado, solicitudes, documentos, empleados y panel RRHH.", priority: "Alta", status: "Pendiente", effort: "Alto" },
  { id: 6, phase: "V2", module: "Auth", title: "Login seguro", description: "Implementar login con access token corto, refresh token rotativo y cierre de sesión.", priority: "Alta", status: "Pendiente", effort: "Alto" },
  { id: 7, phase: "V2", module: "Auth", title: "MFA para administradores", description: "Agregar segundo factor para RRHH, Empresa Admin y Super Admin.", priority: "Alta", status: "Pendiente", effort: "Medio" },
  { id: 8, phase: "V2", module: "Empresas", title: "Multi-tenant por company_id", description: "Todas las tablas sensibles deben separar datos por empresa desde el backend.", priority: "Alta", status: "Pendiente", effort: "Alto" },
  { id: 9, phase: "V2", module: "Auditoría", title: "Audit logs base", description: "Registrar login, cambios de permisos, creación de usuarios y acciones críticas.", priority: "Alta", status: "Pendiente", effort: "Medio" },
  { id: 10, phase: "V3", module: "Empleados", title: "CRUD de empleados", description: "Crear, editar, activar/desactivar empleados, departamentos, posiciones y datos básicos.", priority: "Alta", status: "Pendiente", effort: "Alto" },
  { id: 11, phase: "V3", module: "Flutter", title: "Dashboard de empleado", description: "Pantalla con perfil, solicitudes, documentos, notificaciones y próximos eventos.", priority: "Alta", status: "Pendiente", effort: "Medio" },
  { id: 12, phase: "V3", module: "Solicitudes", title: "Solicitudes de vacaciones", description: "Empleado solicita vacaciones, supervisor aprueba/rechaza y RRHH puede auditar.", priority: "Alta", status: "Pendiente", effort: "Alto" },
  { id: 13, phase: "V3", module: "Solicitudes", title: "Licencias y permisos", description: "Flujo para licencia médica, permiso personal, ausencia y cambio de datos.", priority: "Media", status: "Pendiente", effort: "Alto" },
  { id: 14, phase: "V4", module: "Documentos", title: "Storage privado de documentos", description: "Subir documentos con permisos, URLs firmadas, expiración y logs de descarga.", priority: "Alta", status: "Pendiente", effort: "Alto" },
  { id: 15, phase: "V4", module: "Documentos", title: "Generador de cartas laborales", description: "Plantillas PDF para carta laboral, certificación salarial y constancia de empleo.", priority: "Media", status: "Pendiente", effort: "Medio" },
  { id: 16, phase: "V5", module: "Reportes", title: "Dashboard RRHH", description: "Mostrar empleados activos, solicitudes pendientes, ausencias, documentos y actividad reciente.", priority: "Alta", status: "Pendiente", effort: "Alto" },
  { id: 17, phase: "V5", module: "Notificaciones", title: "Notificaciones push/email", description: "Enviar alertas para aprobaciones, documentos, cambios de estado y tareas pendientes.", priority: "Media", status: "Pendiente", effort: "Medio" },
  { id: 18, phase: "V6", module: "Nómina", title: "Períodos de nómina", description: "Crear períodos, asignar empleados, ingresos, deducciones y cálculo neto inicial.", priority: "Media", status: "Pendiente", effort: "Alto" },
  { id: 19, phase: "V6", module: "Nómina", title: "Recibos de pago PDF", description: "Generar recibo de pago consultable desde app empleado y auditable por RRHH.", priority: "Media", status: "Pendiente", effort: "Medio" },
  { id: 20, phase: "V7", module: "Compliance RD", title: "Research TSS/DGII/DGT", description: "Documentar cálculos, reportes, formatos y responsabilidades legales en República Dominicana.", priority: "Alta", status: "Pendiente", effort: "Alto" },
  { id: 21, phase: "V8", module: "BI", title: "Métricas de ausentismo y headcount", description: "Crear gráficos por departamento, mes, tipo de ausencia y tendencia de empleados.", priority: "Baja", status: "Pendiente", effort: "Medio" },
  { id: 22, phase: "V8", module: "IA", title: "Asistente de RRHH futuro", description: "Explorar IA para resumir solicitudes, generar cartas y detectar patrones de ausencias.", priority: "Baja", status: "Pendiente", effort: "Alto" },
];

const statuses = ["Pendiente", "En progreso", "Bloqueado", "Hecho"];

const phaseMap = { V1: "Fundación", V2: "Auth y empresas", V3: "RRHH Self-Service", V4: "Documentos", V5: "Dashboard Admin", V6: "Payroll Lite", V7: "Cumplimiento RD", V8: "BI + IA" };

const phaseColors = { V1: "bg-blue-100 text-blue-700 border-blue-200", V2: "bg-purple-100 text-purple-700 border-purple-200", V3: "bg-green-100 text-green-700 border-green-200", V4: "bg-amber-100 text-amber-700 border-amber-200", V5: "bg-rose-100 text-rose-700 border-rose-200", V6: "bg-cyan-100 text-cyan-700 border-cyan-200", V7: "bg-orange-100 text-orange-700 border-orange-200", V8: "bg-indigo-100 text-indigo-700 border-indigo-200" };

const modColors = { Producto: "bg-sky-100 text-sky-700", Arquitectura: "bg-violet-100 text-violet-700", Seguridad: "bg-red-100 text-red-700", Infraestructura: "bg-slate-100 text-slate-700", Diseño: "bg-pink-100 text-pink-700", Auth: "bg-blue-100 text-blue-700", Empresas: "bg-teal-100 text-teal-700", Auditoría: "bg-yellow-100 text-yellow-700", Empleados: "bg-green-100 text-green-700", Flutter: "bg-cyan-100 text-cyan-700", Solicitudes: "bg-orange-100 text-orange-700", Documentos: "bg-amber-100 text-amber-700", Reportes: "bg-rose-100 text-rose-700", Notificaciones: "bg-fuchsia-100 text-fuchsia-700", Nómina: "bg-emerald-100 text-emerald-700", "Compliance RD": "bg-red-100 text-red-700", BI: "bg-indigo-100 text-indigo-700", IA: "bg-violet-100 text-violet-700" };

const modules = Object.keys(modColors);

const effortWeight = { Alto: 3, Medio: 2, Bajo: 1 };

function filterTasks(tasks, q, mod, prio, ph) {
  const cq = q.trim().toLowerCase();
  return tasks.filter(t => {
    const st = [t.title, t.module, t.phase, t.priority, t.description].join(" ").toLowerCase();
    return (cq === "" || st.includes(cq)) && (mod === "Todos" || t.module === mod) && (prio === "Todas" || t.priority === prio) && (ph === "Todas" || t.phase === ph);
  });
}

const effortLabels = { Alto: "🔥 Alto", Medio: "⚡ Medio", Bajo: "💤 Bajo" };

function priorityColor(p) { return p === "Alta" ? "bg-red-500" : p === "Media" ? "bg-amber-500" : "bg-slate-400"; }

function ColumnPlaceholder({ status }) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${status}` });
  return <div ref={setNodeRef} className={`min-h-[60px] rounded-xl border-2 border-dashed p-3 text-center text-sm transition-colors ${isOver ? "border-blue-400 bg-blue-50" : "border-slate-200 text-slate-300"}`}>Suelta aquí</div>;
}

function SortableCard({ task, onSelect, isAdmin, userMap }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, disabled: !isAdmin });
  const s = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={s} {...(isAdmin ? { ...attributes, ...listeners } : {})}
      onClick={() => onSelect(task)}
      className={`group rounded-xl border bg-white p-2.5 md:p-3 shadow-sm transition-all ${isAdmin ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} ${isDragging ? "shadow-lg ring-2 ring-blue-400 z-50 rotate-2 scale-105" : "hover:shadow-md hover:-translate-y-0.5"}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${priorityColor(task.priority)}`} />
          <span className={`truncate rounded-md px-2 py-0.5 text-[10px] font-semibold ${modColors[task.module] || "bg-slate-100 text-slate-600"}`}>{task.module}</span>
        </div>
        <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${phaseColors[task.phase] || "bg-slate-100 text-slate-500"}`}>{task.phase}</span>
      </div>
      <h3 className="text-sm font-semibold leading-snug text-slate-900">{task.title}</h3>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
        <span>{effortLabels[task.effort]}</span>
        <span className="text-slate-300">·</span>
        <span className="truncate">{task.description}</span>
      </div>
      {task.assignedName && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600 shrink-0">
            {task.assignedName.charAt(0).toUpperCase()}
          </span>
          <span className="text-[11px] text-slate-500 truncate">{task.assignedName}</span>
        </div>
      )}
      {task.dueDate && (
        <DueDateBadge dueDate={task.dueDate} />
      )}
    </div>
  );
}

function DueDateBadge({ dueDate }) {
  const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  const color = days < 0 ? "text-red-500" : days <= 3 ? "text-amber-500" : "text-emerald-500";
  const label = days < 0 ? `🔴 Vencida` : days === 0 ? `🔴 Hoy` : days === 1 ? `🟡 Mañana` : days <= 3 ? `🟡 ${days} días` : days > 30 ? `🟢 > 30 días` : `🟢 ${days} días`;
  return <div className={`mt-1 text-[11px] font-medium ${color}`}>{label}</div>;
}

function Modal({ open, onClose, children }) {
  useEffect(() => { if (open) document.body.style.overflow = "hidden"; else document.body.style.overflow = ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border bg-white p-4 md:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function TaskForm({ onSave, onClose, initial, users }) {
  const { isAdmin } = useAuth();
  const [f, setF] = useState(initial || { title: "", module: modules[0], phase: "V1", priority: "Media", effort: "Medio", description: "", assignedTo: "", assignedName: "", dueDate: "" });
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">{initial ? "Editar tarea" : "Nueva tarea"}</h2>
      <input placeholder="Título" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-900 transition-colors" autoFocus />
      <textarea placeholder="Descripción (opcional)" value={f.description || ""} onChange={e => setF({ ...f, description: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-900 transition-colors" rows={2} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select value={f.module} onChange={e => setF({ ...f, module: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-900">{modules.map(m => <option key={m} value={m}>{m}</option>)}</select>
        <select value={f.phase} onChange={e => setF({ ...f, phase: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-900">{Object.entries(phaseMap).map(([k, v]) => <option key={k} value={k}>{k} - {v}</option>)}</select>
        <select value={f.priority} onChange={e => setF({ ...f, priority: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-900"><option value="Alta">🔥 Alta</option><option value="Media">⚡ Media</option><option value="Baja">💤 Baja</option></select>
        <select value={f.effort} onChange={e => setF({ ...f, effort: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-900"><option value="Alto">🔥 Alto</option><option value="Medio">⚡ Medio</option><option value="Bajo">💤 Bajo</option></select>
      </div>
      <input value={f.dueDate || ""} onChange={e => setF({ ...f, dueDate: e.target.value })} type="date" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-900 transition-colors" />
      {isAdmin && users.length > 0 && (
        <select value={f.assignedTo} onChange={e => {
          const u = users.find(u => u.id === e.target.value);
          setF({ ...f, assignedTo: e.target.value, assignedName: u ? u.name : "" });
        }} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-900">
          <option value="">Sin asignar</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
        </select>
      )}
      <div className="flex gap-3 pt-1">
        <button onClick={() => f.title && onSave({ ...f, id: initial?.id })} disabled={!f.title} className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition-colors">{initial ? "Actualizar" : "Agregar"}</button>
        <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
      </div>
    </div>
  );
}

function TaskDetail({ task, onEdit, onDelete, onClose, onStatus, isAdmin, onArchive, activeBoardId, users }) {
  const [logs, setLogs] = useState([]);
  const statusOrder = ["Pendiente", "En progreso", "Bloqueado", "Hecho"];
  const currentIdx = statusOrder.indexOf(task.status);

  const availableStatuses = isAdmin
    ? statuses.filter(s => s !== task.status)
    : statuses.filter(s => {
        const targetIdx = statusOrder.indexOf(s);
        return targetIdx > currentIdx && s !== "Bloqueado";
      });

  useEffect(() => {
    if (!activeBoardId) return;
    const q = query(
      collection(db, "boards", activeBoardId, "logs"),
      where("taskId", "==", task.id),
      orderBy("createdAt", "desc"),
      limit(30)
    );
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Logs listener error:", err);
    });
    return unsub;
  }, [task.id, activeBoardId]);

  function formatTimestamp(ts) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "ahora";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString();
  }

  const actionLabels = {
    created: "creó esta tarea",
    updated: "editó esta tarea",
    deleted: "eliminó esta tarea",
    status_changed: "cambió el estado",
    assigned: "asignó esta tarea",
    archived: "archivó esta tarea",
    restored: "restauró esta tarea",
  };

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-3 w-3 rounded-full ${priorityColor(task.priority)}`} />
          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${modColors[task.module] || "bg-slate-100 text-slate-600"}`}>{task.module}</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
      </div>
      <h2 className="text-xl font-bold text-slate-900">{task.title}</h2>
      <p className="text-sm leading-6 text-slate-500">{task.description || "Sin descripción"}</p>
      <div className="rounded-xl bg-slate-50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Estado</span>
          <span className="text-sm font-semibold text-slate-700">{task.status === "Hecho" ? "✅" : task.status === "En progreso" ? "⏳" : task.status === "Bloqueado" ? "⚠️" : "○"} {task.status}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Prioridad</span>
          <span className={`text-sm font-semibold ${task.priority === "Alta" ? "text-red-600" : task.priority === "Media" ? "text-amber-600" : "text-slate-500"}`}>{task.priority}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Fase</span>
          <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${phaseColors[task.phase] || "bg-slate-100 text-slate-500"}`}>{task.phase} - {phaseMap[task.phase]}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Esfuerzo</span>
          <span className="text-sm font-semibold text-slate-700">{effortLabels[task.effort]}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Asignado a</span>
          {isAdmin && users?.length > 0 ? (
            <select
              value={task.assignedTo || ""}
              onChange={async (e) => {
                const userId = e.target.value;
                const u = users.find(uu => uu.id === userId);
                try {
                  await updateDoc(doc(db, "boards", activeBoardId, "tasks", task.id), {
                    assignedTo: userId,
                    assignedName: u ? u.name : "",
                    updatedAt: serverTimestamp(),
                  });
                } catch (err) {
                  console.error("Error assigning task:", err);
                }
              }}
              className="text-right text-sm font-semibold text-slate-700 bg-transparent border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-slate-400 cursor-pointer max-w-[160px]"
            >
              <option value="">Sin asignar</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          ) : (
            <p className="text-sm font-semibold text-slate-700">{task.assignedName || "—"}</p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Fecha límite</span>
          <p className="text-sm font-semibold text-slate-700">{task.dueDate ? (() => {
            const days = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
            const icon = days < 0 ? "🔴" : days <= 3 ? "🟡" : "🟢";
            return `${icon} ${new Date(task.dueDate).toLocaleDateString()}`;
          })() : "—"}</p>
        </div>
      </div>
      {availableStatuses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableStatuses.map(s => (
            <button key={s} onClick={() => { onStatus(task.id, s); onClose(); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">→ {s}</button>
          ))}
        </div>
      )}
      {isAdmin && (
        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
          <button onClick={() => { onEdit(task); onClose(); }} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors">✎ Editar</button>
          {task.archived ? (
            <button onClick={() => { onArchive(task.id, false); onClose(); }} className="rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-100 transition-colors">📦 Restaurar</button>
          ) : (
            <button onClick={() => { onArchive(task.id, true); onClose(); }} className="rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-600 hover:bg-amber-100 transition-colors">📦 Archivar</button>
          )}
          <button onClick={() => { if (confirm("¿Eliminar esta tarea?")) { onDelete(task.id); onClose(); } }} className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors">🗑️ Eliminar</button>
        </div>
      )}
      {logs.length > 0 && (
        <div className="border-t border-slate-100 pt-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Actividad</h3>
          <div className="space-y-2">
            {logs.map(l => (
              <div key={l.id} className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                <div>
                  <span className="font-medium text-slate-700">{l.userName}</span>{" "}
                  <span className="text-slate-500">{actionLabels[l.action] || l.action}</span>
                  {l.details && <span className="text-slate-400"> · {l.details}</span>}
                  <span className="text-slate-300 ml-1">{formatTimestamp(l.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LoginForm() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, password, name);
      }
    } catch (err) {
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Correo o contraseña incorrectos");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Este correo ya está registrado");
      } else if (err.code === "auth/weak-password") {
        setError("La contraseña debe tener al menos 6 caracteres");
      } else if (err.code === "auth/invalid-email") {
        setError("Correo electrónico inválido");
      } else {
        setError(err.message);
      }
    }
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">N</span>
          <h1 className="mt-3 text-lg font-bold text-slate-900">NoraHR Roadmap</h1>
          <p className="text-sm text-slate-400">{mode === "login" ? "Inicia sesión para continuar" : "Crea tu cuenta"}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" required
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 transition-colors" />
          )}
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo electrónico" type="email" required autoComplete="email"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 transition-colors" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" type="password" required autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 transition-colors" />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={submitting}
            className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition-colors">
            {submitting ? "..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">
          {mode === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            className="text-blue-600 hover:underline font-medium">
            {mode === "login" ? "Crear cuenta" : "Iniciar sesión"}
          </button>
        </p>
      </div>
    </div>
  );
}

function AdminPanel({ users, currentUser, onClose }) {
  const [updating, setUpdating] = useState({});

  async function toggleRole(uid, currentRole) {
    setUpdating(p => ({ ...p, [uid]: true }));
    try {
      await updateDoc(doc(db, "users", uid), {
        role: currentRole === "admin" ? "member" : "admin",
      });
    } catch (e) {
      alert("Error al cambiar rol");
    }
    setUpdating(p => ({ ...p, [uid]: false }));
  }

  async function removeUser(uid, email) {
    if (!confirm(`¿Eliminar a ${email} de la organización?`)) return;
    try {
      await deleteDoc(doc(db, "users", uid));
    } catch (e) {
      alert("Error al eliminar usuario");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">⚙️ Administrar usuarios</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
      </div>
      <p className="text-xs text-slate-400">El primer usuario registrado es admin automáticamente.</p>
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">{u.name || u.email}</p>
              <p className="text-xs text-slate-400 truncate">{u.email}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"}`}>{u.role}</span>
              {u.id !== currentUser?.uid && (
                <>
                  <button onClick={() => toggleRole(u.id, u.role)} disabled={updating[u.id]}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                    {u.role === "admin" ? "Hacer member" : "Hacer admin"}
                  </button>
                  <button onClick={() => removeUser(u.id, u.email)}
                    className="rounded-lg border border-red-200 px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50 transition-colors">
                    Eliminar
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NoraHRKanban() {
  const { user, userData, loading, logout, isAdmin } = useAuth();
  const { activeBoardId, boards } = useBoard();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mod, setMod] = useState("Todos");
  const [prio, setPrio] = useState("Todas");
  const [phase, setPhase] = useState("Todas");
  const [showAdd, setShowAdd] = useState(false);
  const [editT, setEditT] = useState(null);
  const [detailT, setDetailT] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [showAdmin, setShowAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const seeded = useRef({});
  const migrated = useRef(false);
  const boardsRef = useRef(boards);
  boardsRef.current = boards;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!user || !activeBoardId) return;
    const q = query(collection(db, "boards", activeBoardId, "tasks"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const ts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTasks(ts);
      const missingOrder = ts.filter(t => t.order === undefined || t.order === null);
      if (missingOrder.length > 0) {
        Promise.allSettled(
          missingOrder.map(t =>
            updateDoc(doc(db, "boards", activeBoardId, "tasks", t.id), { order: Date.now() })
          )
        );
      }
      if (snap.empty && isAdmin && !seeded.current[activeBoardId]) {
        seeded.current[activeBoardId] = true;
        const board = boardsRef.current.find(b => b.id === activeBoardId);
        if (board && board.name === "NoraHR Roadmap") {
          (async () => {
            try {
              const results = await Promise.allSettled(
                initialTasks.map(async (t, idx) => {
                  const { id, ...data } = t;
                  return addDoc(collection(db, "boards", activeBoardId, "tasks"), {
                    ...data,
                    order: Date.now() + idx,
                    dueDate: "",
                    archived: false,
                    assignedTo: "",
                    assignedName: "",
                    createdBy: user.uid,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                  });
                })
              );
              const rejected = results.filter(r => r.status === "rejected");
              if (rejected.length > 0) console.error("Error seeding tasks:", rejected);
            } catch (e) {
              console.error("Error seeding tasks:", e);
            }
          })();
        }
      }
    });
    return unsub;
  }, [user, isAdmin, activeBoardId]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user || !isAdmin || !activeBoardId || migrated.current) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "tasks"));
        if (snap.empty) { migrated.current = true; return; }
        const writes = snap.docs.map((d, idx) =>
          setDoc(doc(db, "boards", activeBoardId, "tasks", d.id), {
            ...d.data(),
            order: d.data().order || Date.now() + idx,
            dueDate: d.data().dueDate || "",
            archived: d.data().archived || false,
            updatedAt: serverTimestamp(),
          })
        );
        await Promise.all(writes);
        await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "tasks", d.id))));
        migrated.current = true;
      } catch (e) {
        console.error("Migration failed:", e);
      }
    })();
  }, [user, isAdmin, activeBoardId]);

  const userMap = useMemo(() => {
    const m = {};
    users.forEach(u => { m[u.id] = u; });
    return m;
  }, [users]);

  const displayedTasks = useMemo(() => {
    let ts = tasks.filter(t => showArchived ? t.archived : !t.archived);
    if (overdueOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      ts = ts.filter(t => t.dueDate && new Date(t.dueDate) < today);
    }
    return filterTasks(ts, searchQuery, mod, prio, phase);
  }, [tasks, searchQuery, mod, prio, phase, showArchived, overdueOnly]);

  const overdueCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter(t => !t.archived && t.dueDate && new Date(t.dueDate) < today).length;
  }, [tasks]);

  const columns = useMemo(() => {
    const byCol = {};
    statuses.forEach(s => byCol[s] = []);
    displayedTasks.forEach(t => { if (byCol[t.status]) byCol[t.status].push(t); });
    return statuses.map(s => ({ status: s, items: byCol[s] }));
  }, [displayedTasks]);

  const done = tasks.filter(t => t.status === "Hecho").length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const effortDone = tasks.filter(t => t.status === "Hecho").reduce((a, t) => a + (effortWeight[t.effort] || 0), 0);
  const effortTotal = tasks.reduce((a, t) => a + (effortWeight[t.effort] || 0), 0);

  async function createLog(taskId, taskTitle, action, details) {
    if (!user || !activeBoardId) return;
    try {
      await addDoc(collection(db, "boards", activeBoardId, "logs"), {
        action,
        taskId,
        taskTitle,
        details: details || "",
        userId: user.uid,
        userName: userData?.name || user.email,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Error creating log:", e);
    }
  }

  async function archiveTask(id, archived) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    try {
      await updateDoc(doc(db, "boards", activeBoardId, "tasks", id), { archived, updatedAt: serverTimestamp() });
      createLog(id, task.title, archived ? "archived" : "restored", "");
    } catch (e) {
      console.error("Error archiving task:", e);
    }
  }

  async function handleDragEnd(e) {
    const { active, over } = e;
    if (!over || !isAdmin) return;

    const taskId = String(active.id);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const overStr = String(over.id);
    let newStatus = null;
    let isReorder = false;

    if (overStr.startsWith("column-")) {
      newStatus = overStr.replace("column-", "");
    } else {
      const overTask = tasks.find(t => t.id === overStr);
      if (overTask) {
        if (overTask.status !== task.status) {
          newStatus = overTask.status;
        } else if (taskId !== overStr) {
          isReorder = true;
        }
      }
    }

    if (newStatus || isReorder) {
      try {
        const updates = { updatedAt: serverTimestamp(), order: Date.now() };
        if (newStatus) updates.status = newStatus;
        await updateDoc(doc(db, "boards", activeBoardId, "tasks", taskId), updates);
        if (newStatus) createLog(taskId, task.title, "status_changed", `${task.status} → ${newStatus}`);
      } catch (e) {
        console.error("Error updating task status:", e);
      }
    }
  }

  async function updateStatus(id, s) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    try {
      await updateDoc(doc(db, "boards", activeBoardId, "tasks", id), { status: s, order: Date.now(), updatedAt: serverTimestamp() });
      createLog(id, task.title, "status_changed", `${task.status} → ${s}`);
    } catch (e) {
      console.error("Error updating status:", e);
    }
  }

  async function deleteTask(id) {
    const task = tasks.find(t => t.id === id);
    try {
      await deleteDoc(doc(db, "boards", activeBoardId, "tasks", id));
      if (task) createLog(id, task.title, "deleted", "");
    } catch (e) {
      console.error("Error deleting task:", e);
    }
  }

  async function addTask(f) {
    try {
      const ref = await addDoc(collection(db, "boards", activeBoardId, "tasks"), {
        title: f.title,
        module: f.module,
        phase: f.phase,
        priority: f.priority,
        effort: f.effort,
        description: f.description || "",
        status: "Pendiente",
        order: Date.now(),
        dueDate: f.dueDate || "",
        archived: false,
        assignedTo: f.assignedTo || "",
        assignedName: f.assignedName || "",
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      createLog(ref.id, f.title, "created", "");
      setShowAdd(false);
    } catch (e) {
      console.error("Error adding task:", e);
    }
  }

  async function editTask(f) {
    try {
      const { id, ...data } = f;
      await updateDoc(doc(db, "boards", activeBoardId, "tasks", id), { ...data, updatedAt: serverTimestamp() });
      createLog(id, f.title, "updated", "");
      setEditT(null);
    } catch (e) {
      console.error("Error editing task:", e);
    }
  }

  function exportCSV() {
    const headers = "Título,Módulo,Fase,Prioridad,Esfuerzo,Estado,Asignado\n";
    const rows = tasks.filter(t => !t.archived).map(t => `"${t.title}","${t.module}","${t.phase} - ${phaseMap[t.phase]}","${t.priority}","${t.effort}","${t.status}","${t.assignedName || ""}"`).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "norahr-tasks.csv"; a.click();
  }

  function toggleCollapse(s) { setCollapsed(c => ({ ...c, [s]: !c[s] })); }

  const activeBoardName = useMemo(() => {
    const b = boards.find(b => b.id === activeBoardId);
    return b ? b.name : "NoraHR Roadmap";
  }, [boards, activeBoardId]);

  const phasesOptions = ["Todas", ...Object.keys(phaseMap)];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
          <p className="mt-3 text-sm text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginForm />;

  return (
    <>
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-[#f8f9fa]">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">N</span>
              <div>
                <h1 className="text-sm font-bold text-slate-900">{activeBoardName}</h1>
                <p className="text-[11px] text-slate-400">{tasks.length} tareas · {progress}% · {Math.round((effortDone / effortTotal) * 100)}% esfuerzo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSidebarOpen(true)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">📋 Boards</button>
              <div className="hidden md:flex items-center gap-2">
                <span className="text-[11px] text-slate-400">
                  👤 {userData?.name || user.email}
                  <span className={`ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${isAdmin ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-500"}`}>{isAdmin ? "Admin" : "Member"}</span>
                </span>
                {isAdmin && (
                  <button onClick={() => setShowAdmin(true)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">⚙️ Admin</button>
                )}
                <button onClick={() => setShowArchived(!showArchived)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${showArchived ? "bg-amber-100 text-amber-700 border-amber-200" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  {showArchived ? "📦 Ver activas" : "📦 Archivadas"}
                </button>
                {overdueCount > 0 && !showArchived && (
                  <button onClick={() => setOverdueOnly(!overdueOnly)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${overdueOnly ? "bg-red-100 text-red-700 border-red-200" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    🔴 {overdueOnly ? "Todas" : `${overdueCount} vencidas`}
                  </button>
                )}
                <button onClick={exportCSV} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">Export</button>
                <button onClick={logout} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors">Salir</button>
              </div>
              {isAdmin && (
                <button onClick={() => setShowAdd(true)} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors">+ Nueva</button>
              )}
              <div className="relative md:hidden">
                <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">☰</button>
                {showMobileMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-slate-200 bg-white shadow-xl p-2 space-y-1 z-50">
                    <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-100">
                      👤 {userData?.name || user.email}
                      <span className={`ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${isAdmin ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-500"}`}>{isAdmin ? "Admin" : "Member"}</span>
                    </div>
                    {isAdmin && (
                      <button onClick={() => { setShowAdmin(true); setShowMobileMenu(false); }} className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">⚙️ Admin</button>
                    )}
                    <button onClick={() => { setShowArchived(!showArchived); setShowMobileMenu(false); }} className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                      {showArchived ? "📦 Activas" : "📦 Archivadas"}
                    </button>
                    {overdueCount > 0 && !showArchived && (
                      <button onClick={() => { setOverdueOnly(!overdueOnly); setShowMobileMenu(false); }} className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                        🔴 {overdueOnly ? "Todas" : `${overdueCount} vencidas`}
                      </button>
                    )}
                    <button onClick={() => { exportCSV(); setShowMobileMenu(false); }} className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">📥 Export CSV</button>
                    <button onClick={logout} className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">🚪 Salir</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar..." className="min-w-[140px] md:min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-slate-400 transition-colors" />
            <button onClick={() => setShowFilters(!showFilters)} className="md:hidden rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              {showFilters ? "▲ Filtros" : "▼ Filtros"}
            </button>
            <div className={`${showFilters ? "flex" : "hidden"} md:flex flex-wrap items-center gap-2 w-full md:w-auto`}>
              <select value={mod} onChange={e => setMod(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none">
                <option value="Todos">Módulos</option>{modules.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={prio} onChange={e => setPrio(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none">
                <option value="Todas">Prioridades</option><option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option>
              </select>
              <select value={phase} onChange={e => setPhase(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none">
                {phasesOptions.map(p => <option key={p} value={p}>{p === "Todas" ? "Fases" : `${p} - ${phaseMap[p]}`}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 md:grid md:grid-cols-4">
            {columns.map(({ status, items }) => {
              const colDone = items.filter(t => t.status === "Hecho").length;
              const colTotal = items.length;
              const colProgress = colTotal ? Math.round((colDone / colTotal) * 100) : 0;

              const colAccents = {
                Pendiente: { head: "bg-slate-100 text-slate-600", count: "bg-slate-200 text-slate-600", border: "border-slate-200", bar: "bg-slate-300" },
                "En progreso": { head: "bg-blue-100 text-blue-600", count: "bg-blue-200 text-blue-600", border: "border-blue-200", bar: "bg-blue-500" },
                Bloqueado: { head: "bg-rose-100 text-rose-600", count: "bg-rose-200 text-rose-600", border: "border-rose-200", bar: "bg-rose-500" },
                Hecho: { head: "bg-emerald-100 text-emerald-600", count: "bg-emerald-200 text-emerald-600", border: "border-emerald-200", bar: "bg-emerald-500" },
              }[status];

              const icons = { Pendiente: "○", "En progreso": "⏳", Bloqueado: "⚠️", Hecho: "✅" };

              return (
                <div key={status} className={`min-w-[280px] snap-start md:min-w-0 rounded-xl border bg-white shadow-sm ${colAccents.border}`}>
                  <div className={`flex items-center justify-between rounded-t-xl px-4 py-2.5 ${colAccents.head}`}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleCollapse(status)} className="text-xs opacity-60 hover:opacity-100">{collapsed[status] ? "▶" : "▼"}</button>
                      <span className="text-sm">{icons[status]}</span>
                      <h2 className="text-sm font-semibold">{status}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${colAccents.count}`}>{items.length}</span>
                      {!collapsed[status] && colTotal > 0 && (
                        <span className="text-[10px] text-slate-400">
                          {items.reduce((a, t) => a + (effortWeight[t.effort] || 0), 0)}pts
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`overflow-hidden transition-all ${collapsed[status] ? "max-h-0" : "max-h-[9999px]"}`}>
                    {colTotal > 0 && (
                      <div className="px-4 pt-3">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>Progreso</span>
                          <span>{colProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full transition-all duration-300 ${colAccents.bar}`} style={{ width: `${colProgress}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="p-3">
                      <SortableContext items={items.map(t => t.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2.5">
                          {items.map(t => <SortableCard key={t.id} task={t} onSelect={setDetailT} isAdmin={isAdmin} userMap={userMap} />)}
                          {isAdmin && <ColumnPlaceholder status={status} />}
                        </div>
                      </SortableContext>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)}>
        <TaskForm onSave={addTask} onClose={() => setShowAdd(false)} users={users} />
      </Modal>

      <Modal open={!!editT} onClose={() => setEditT(null)}>
        {editT && <TaskForm onSave={editTask} onClose={() => setEditT(null)} initial={editT} users={users} />}
      </Modal>

      <Modal open={!!detailT} onClose={() => setDetailT(null)}>
        <ErrorBoundary key={detailT?.id}>
          {detailT && <TaskDetail task={detailT} onEdit={setEditT} onDelete={deleteTask} onClose={() => setDetailT(null)} onStatus={updateStatus} onArchive={archiveTask} isAdmin={isAdmin} activeBoardId={activeBoardId} users={users} />}
        </ErrorBoundary>
      </Modal>

      <Modal open={showAdmin} onClose={() => setShowAdmin(false)}>
        <AdminPanel users={users} currentUser={user} onClose={() => setShowAdmin(false)} />
      </Modal>
    </DndContext>

    <button
      onClick={() => setSidebarOpen(!sidebarOpen)}
      className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 items-center justify-center h-20 w-6 rounded-l-lg border border-r-0 border-slate-300 bg-white shadow-md text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
    >
      {sidebarOpen ? "▶" : "◀"}
    </button>
    <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
