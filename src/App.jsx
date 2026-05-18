import React, { Component, useMemo, useState, useEffect, useRef, useCallback } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, useDroppable, DragOverlay } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { collection, onSnapshot, query, orderBy, where, limit, addDoc, updateDoc, deleteDoc, doc, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import {
  Archive,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Flag,
  Flame,
  Gauge,
  LayoutDashboard,
  ListFilter,
  Loader2,
  Lock,
  MessageSquare,
  MoreVertical,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Server,
  Settings,
  SlidersHorizontal,
  Tag,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
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

const phaseColors = { V1: "bg-blue-100 text-blue-700 border-blue-200", V2: "bg-cyan-100 text-cyan-700 border-cyan-200", V3: "bg-green-100 text-green-700 border-green-200", V4: "bg-amber-100 text-amber-700 border-amber-200", V5: "bg-rose-100 text-rose-700 border-rose-200", V6: "bg-cyan-100 text-cyan-700 border-cyan-200", V7: "bg-orange-100 text-orange-700 border-orange-200", V8: "bg-blue-100 text-blue-700 border-blue-200" };

const modColors = { Producto: "bg-sky-100 text-sky-700", Arquitectura: "bg-cyan-100 text-cyan-700", Seguridad: "bg-red-100 text-red-700", Infraestructura: "bg-slate-100 text-slate-700", Diseño: "bg-pink-100 text-pink-700", Auth: "bg-blue-100 text-blue-700", Empresas: "bg-teal-100 text-teal-700", Auditoría: "bg-yellow-100 text-yellow-700", Empleados: "bg-green-100 text-green-700", Flutter: "bg-cyan-100 text-cyan-700", Solicitudes: "bg-orange-100 text-orange-700", Documentos: "bg-amber-100 text-amber-700", Reportes: "bg-rose-100 text-rose-700", Notificaciones: "bg-sky-100 text-sky-700", Nómina: "bg-emerald-100 text-emerald-700", "Compliance RD": "bg-red-100 text-red-700", BI: "bg-blue-100 text-blue-700", IA: "bg-cyan-100 text-cyan-700" };

const modules = Object.keys(modColors);

const effortWeight = { Alto: 3, Medio: 2, Bajo: 1 };

const LOCAL_TASKS_KEY = "norahr.local.tasks";
const LOCAL_COMMENTS_KEY = "norahr.local.comments";
const LOCAL_IT_CONFIG_KEY = "norahr.local.itConfig";
const LOCAL_LOGS_KEY = "norahr.local.logs";

const defaultItConfig = {
  systems: ["Network", "Microsoft 365", "Active Directory", "Firewall", "Endpoints", "ERP"],
  ticketTypes: ["Incidente", "Cambio", "Mantenimiento", "Acceso", "Proyecto"],
  impacts: ["Bajo", "Medio", "Alto", "Crítico"],
  urgencies: ["Baja", "Media", "Alta", "Crítica"],
  team: ["Demo NoraHR", "IT Manager", "Soporte Nivel 1", "Infraestructura"],
  jobTitles: [
    "IT Project Manager",
    "System Administrator",
    "Ciberseguridad",
    "DevOps Engineer",
    "Network Engineer",
    "Database Administrator",
    "Cloud Architect",
    "Soporte Técnico",
    "Help Desk Analyst",
    "IT Auditor",
  ],
  jobTitleHierarchy: {
    "IT Project Manager": "manager",
    "System Administrator": "admin",
    "Ciberseguridad": "admin",
    "DevOps Engineer": "editor",
    "Network Engineer": "editor",
    "Database Administrator": "editor",
    "Cloud Architect": "editor",
    "Soporte Técnico": "viewer",
    "Help Desk Analyst": "viewer",
    "IT Auditor": "viewer",
  },
};

function readLocalJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeLocalJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("localStorage write failed:", key, e);
  }
}

function makeChecklist(title) {
  return [
    { id: "scope", text: "Validar alcance", done: false },
    { id: "execute", text: title?.toLowerCase().includes("research") ? "Documentar hallazgos" : "Ejecutar trabajo técnico", done: false },
    { id: "verify", text: "Verificar y cerrar", done: false },
  ];
}

function enrichLocalTask(task, idx, config = defaultItConfig) {
  return {
    ...task,
    id: String(task.id),
    order: task.order ?? idx,
    dueDate: task.dueDate || "",
    archived: Boolean(task.archived),
    assignedTo: task.assignedTo || "local-demo-user",
    assignedName: task.assignedName || "Demo NoraHR",
    ticketType: task.ticketType || config.ticketTypes[idx % config.ticketTypes.length],
    requester: task.requester || "Operaciones IT",
    system: task.system || config.systems[idx % config.systems.length],
    impact: task.impact || (task.priority === "Alta" ? "Alto" : "Medio"),
    urgency: task.urgency || (task.priority === "Alta" ? "Alta" : "Media"),
    slaHours: task.slaHours || (task.priority === "Alta" ? 24 : 72),
    checklist: Array.isArray(task.checklist) && task.checklist.length ? task.checklist : makeChecklist(task.title),
    operationalState: task.operationalState || "normal",
    blockedReason: task.blockedReason || "",
  };
}

function checklistProgress(task) {
  const items = Array.isArray(task.checklist) ? task.checklist : [];
  if (!items.length) return { done: 0, total: 0, pct: 0 };
  const done = items.filter(i => i.done).length;
  return { done, total: items.length, pct: Math.round((done / items.length) * 100) };
}

const operationalStates = {
  normal: { label: "Normal", tone: "border-slate-200 bg-slate-50 text-slate-600", icon: Circle },
  follow_up: { label: "Necesita seguimiento", tone: "border-amber-100 bg-amber-50 text-amber-700", icon: Clock3 },
  blocked: { label: "Bloqueada", tone: "border-rose-100 bg-rose-50 text-rose-700", icon: Lock },
  ready_to_close: { label: "Lista para cerrar", tone: "border-emerald-100 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
};

function isTaskOverdue(task) {
  if (!task.dueDate || task.status === "Hecho") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.dueDate) < today;
}

function getOperationalState(task) {
  if (task.status === "Bloqueado") return "blocked";
  return task.operationalState || "normal";
}

function isReadyToClose(task) {
  const checklist = checklistProgress(task);
  return task.status !== "Hecho" && checklist.total > 0 && checklist.done === checklist.total;
}

function operationalRank(task) {
  if (isTaskOverdue(task)) return 0;
  if (getOperationalState(task) === "blocked") return 1;
  if (task.urgency === "Crítica" || task.urgency === "Alta" || task.priority === "Alta") return 2;
  if (!task.assignedTo && !task.assignedName) return 3;
  if (isReadyToClose(task)) return 4;
  return 5;
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function filterTasks(tasks, q, mod, prio, ph) {
  const cq = q.trim().toLowerCase();
  return tasks.filter(t => {
    const st = [t.title, t.module, t.phase, t.priority, t.description, t.system, t.ticketType, t.requester, t.impact, t.urgency].join(" ").toLowerCase();
    return (cq === "" || st.includes(cq)) && (mod === "Todos" || t.module === mod) && (prio === "Todas" || t.priority === prio) && (ph === "Todas" || t.phase === ph);
  });
}

const priorityMeta = {
  Alta: { label: "Alta", icon: Flame, tone: "text-red-600 bg-red-50 border-red-100" },
  Media: { label: "Media", icon: Flag, tone: "text-amber-600 bg-amber-50 border-amber-100" },
  Baja: { label: "Baja", icon: Circle, tone: "text-slate-500 bg-slate-50 border-slate-100" },
};

const statusMeta = {
  Pendiente: { icon: Circle, tone: "text-slate-600", soft: "bg-slate-100 text-slate-700 border-slate-200", accent: "bg-slate-400" },
  "En progreso": { icon: Loader2, tone: "text-blue-600", soft: "bg-blue-50 text-blue-700 border-blue-100", accent: "bg-blue-500" },
  Bloqueado: { icon: Lock, tone: "text-rose-600", soft: "bg-rose-50 text-rose-700 border-rose-100", accent: "bg-rose-500" },
  Hecho: { icon: CheckCircle2, tone: "text-emerald-600", soft: "bg-emerald-50 text-emerald-700 border-emerald-100", accent: "bg-emerald-500" },
};

function Avatar({ name, size = "sm" }) {
  const dim = size === "lg" ? "h-11 w-11 text-base" : "h-7 w-7 text-xs";
  return (
    <span className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-full bg-cyan-600 font-bold text-white shadow-sm`}>
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}

function FieldPill({ icon: Icon, children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-medium ${className}`}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}

function DroppableZone({ status }) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${status}` });
  return (
    <div ref={setNodeRef} className={`min-h-[42px] rounded-lg border border-dashed transition-colors ${isOver ? "border-cyan-300 bg-cyan-50" : "border-transparent"}`} />
  );
}

function CardContent({ task, onTaskPatch, isAdmin, users }) {
  const meta = priorityMeta[task.priority] || priorityMeta.Media;
  const PriorityIcon = meta.icon;
  const checklist = checklistProgress(task);
  const isBlocked = task.status === "Bloqueado";
  const isCritical = task.urgency === "Crítica";
  const opKey = getOperationalState(task);
  const opMeta = operationalStates[opKey] || operationalStates.normal;
  const OpIcon = opMeta.icon;
  const slaTone = task.slaHours ? "border-cyan-100 bg-cyan-50 text-cyan-700" : "border-slate-200 bg-slate-50 text-slate-400";
  const impactTone = task.impact === "Crítico" || task.impact === "Alto" ? "border-red-100 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-600";
  const urgencyTone = task.urgency === "Crítica" || task.urgency === "Alta" ? "border-amber-100 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-600";
  const badgeBase = "inline-flex min-h-[24px] max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold leading-none";

  function CardBadge({ icon: Icon, children, className = "" }) {
    return (
      <span className={`${badgeBase} ${className}`}>
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        <span className="truncate">{children}</span>
      </span>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="flex min-w-0 flex-1 items-start gap-2 pr-7 text-[14px] font-bold leading-snug text-slate-950">
          <PriorityIcon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.tone.split(" ")[0]}`} />
          <span className="line-clamp-2">{task.title}</span>
          {isBlocked && <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />}
        </h3>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <CardBadge icon={Server} className="border-cyan-100 bg-cyan-50 text-cyan-700">{task.system || "Sin sistema"}</CardBadge>
        <CardBadge className="border-slate-200 bg-white text-slate-700">{task.ticketType || "Sin tipo"}</CardBadge>
        <CardBadge icon={OpIcon} className={opMeta.tone}>{opMeta.label}</CardBadge>
        <div className="min-w-0">
          {isAdmin ? (
            <select value={task.module} onChange={e => { e.stopPropagation(); onTaskPatch?.(task.id, { module: e.target.value }); }}
              onPointerDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
              className={`min-h-[24px] max-w-[132px] rounded-md border px-2 py-1 text-[11px] font-semibold outline-none ${modColors[task.module] || "bg-slate-100 text-slate-600"} border-transparent`}>
              {modules.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          ) : (
            <span className={`${badgeBase} ${modColors[task.module] || "bg-slate-100 text-slate-600"} border-transparent`}>
              <Tag className="h-3 w-3" />{task.module}
            </span>
          )}
        </div>
        <div className="min-w-0">
          {isAdmin ? (
            <select value={task.phase} onChange={e => { e.stopPropagation(); onTaskPatch?.(task.id, { phase: e.target.value }); }}
              onPointerDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
              className={`min-h-[24px] rounded-md border px-2 py-1 text-[11px] font-semibold outline-none ${phaseColors[task.phase] || "bg-slate-100 text-slate-500"}`}>
              {Object.entries(phaseMap).map(([k]) => <option key={k} value={k}>{k}</option>)}
            </select>
          ) : (
            <span className={`${badgeBase} ${phaseColors[task.phase] || "bg-slate-100 text-slate-500"}`}>
              {task.phase}
            </span>
          )}
        </div>
        <CardBadge icon={PriorityIcon} className={meta.tone}>{task.priority || "Prioridad"}</CardBadge>
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
        <CardBadge icon={Gauge} className={impactTone}>Impacto: {task.impact || "N/D"}</CardBadge>
        <CardBadge icon={Flame} className={urgencyTone}>Urgencia: {task.urgency || "N/D"}</CardBadge>
        <CardBadge icon={Clock3} className={slaTone}>{task.slaHours ? `${task.slaHours}h SLA` : "Sin SLA"}</CardBadge>
        <CardBadge icon={CheckCircle2} className="border-slate-200 bg-slate-50 text-slate-600">{checklist.done}/{checklist.total}</CardBadge>
        {task.dueDate && <DueDateBadge dueDate={task.dueDate} />}
        <div className="flex shrink-0 items-center">
          {task.assignedName ? (
            <Avatar name={task.assignedName} />
          ) : (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-300">
              <User className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SortableCard({ task, onSelect, isAdmin, userMap, deleteMode, onDelete, onTaskPatch, isLocal, users, deletingId }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, disabled: !isAdmin || deleteMode });
  const s = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

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

  return (
    <div ref={setNodeRef} style={s} {...attributes} {...listeners}
      onClick={openCard}
      className={`group relative rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-all ${borderClass} ${isAdmin && !deleteMode ? "cursor-grab active:cursor-grabbing" : deleteMode ? "cursor-default" : "cursor-pointer"} ${isDragging ? "z-50 rotate-1 scale-[1.02] shadow-xl ring-2 ring-cyan-300" : "hover:border-slate-300 hover:shadow-md"}`}>
      {isAdmin && !deleteMode && (
        <button
          type="button"
          aria-label="Arrastrar tarea"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-md text-slate-300 hover:bg-slate-100 hover:text-slate-600"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      )}
      {deleteMode && isAdmin && (
        <button
          onClick={(e) => { e.stopPropagation(); if (confirm("¿Eliminar esta tarea?")) { onDelete(task.id); } }}
          disabled={deletingId === task.id}
          className="absolute -right-1.5 -top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 disabled:opacity-40 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <CardContent task={task} onTaskPatch={onTaskPatch} isAdmin={isAdmin} users={users} />
    </div>
  );
}

function Column({ status, items, collapsed, toggleCollapse, isAdmin, deleteMode, onSelect, onDelete, userMap, onAdd, onTaskPatch, isLocal, users, deletingId }) {
  const colDone = items.filter(t => t.status === "Hecho").length;
  const colTotal = items.length;
  const colProgress = colTotal ? Math.round((colDone / colTotal) * 100) : 0;

  const colAccents = statusMeta[status] || statusMeta.Pendiente;
  const StatusIcon = colAccents.icon;

  return (
    <div className="min-w-[340px] snap-start rounded-xl border border-slate-200/80 bg-slate-100/80 shadow-sm md:min-w-0">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <button onClick={() => toggleCollapse(status)} className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-white hover:text-slate-700">
            {collapsed[status] ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <StatusIcon className={`h-4 w-4 ${colAccents.tone}`} />
          <h2 className="text-sm font-bold text-slate-800">{status}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-slate-500 shadow-sm">{items.length}</span>
          {!collapsed[status] && colTotal > 0 && (
            <span className="text-[10px] text-slate-400">
              {items.reduce((a, t) => a + (effortWeight[t.effort] || 0), 0)}pts
            </span>
          )}
          {isAdmin && (
            <button onClick={() => onAdd(status)} className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-white hover:text-cyan-600">
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className={`overflow-hidden transition-all ${collapsed[status] ? "max-h-0" : "max-h-[9999px]"}`}>
        {colTotal > 0 && (
          <div className="px-3">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Progreso</span>
              <span>{colProgress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full transition-all duration-300 ${colAccents.accent}`} style={{ width: `${colProgress}%` }} />
            </div>
          </div>
        )}
        <div className="p-1.5">
          <SortableContext items={items.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {items.map(t => <SortableCard key={t.id} task={t} onSelect={onSelect} isAdmin={isAdmin} userMap={userMap} deleteMode={deleteMode} onDelete={onDelete} onTaskPatch={onTaskPatch} isLocal={isLocal} users={users} deletingId={deletingId} />)}
              {isAdmin && <DroppableZone status={status} />}
            </div>
          </SortableContext>
        </div>
      </div>
    </div>
  );
}

function DueDateBadge({ dueDate }) {
  const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  const isOverdue = days < 0;
  const color = isOverdue ? "text-red-600 bg-red-50 border-red-200" : days <= 3 ? "text-amber-600 bg-amber-50 border-amber-200" : "text-emerald-600 bg-emerald-50 border-emerald-200";
  const label = days < 0 ? `Vencida` : days === 0 ? `Hoy` : days === 1 ? `Mañana` : days > 30 ? `> 30 días` : `${days} días`;
  return <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${color}`}>{isOverdue ? <Flame className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}{label}</span>;
}

function Modal({ open, onClose, children, wide = false }) {
  useEffect(() => { if (open) document.body.style.overflow = "hidden"; else document.body.style.overflow = ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-2 backdrop-blur-sm md:p-4" onClick={onClose}>
      <div className={`w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${wide ? "max-w-[1420px] p-0" : "max-w-lg p-4 md:p-6"}`} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function TaskForm({ onSave, onClose, initial, users, itConfig = defaultItConfig, isLocal = false }) {
  const { isAdmin } = useAuth();
  const [f, setF] = useState(initial || {
    title: "",
    module: modules[0],
    phase: "V1",
    priority: "Media",
    effort: "Medio",
    description: "",
    assignedTo: "",
    assignedName: "",
    dueDate: "",
    ticketType: itConfig.ticketTypes[0] || "",
    requester: "Operaciones IT",
    system: itConfig.systems[0] || "",
    impact: "Medio",
    urgency: "Media",
    slaHours: 72,
    checklist: makeChecklist("Nueva tarea"),
  });
  const [newCheckItem, setNewCheckItem] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addCheckItem() {
    const text = newCheckItem.trim();
    if (!text) return;
    setF({ ...f, checklist: [...(f.checklist || []), { id: `check-${Date.now()}`, text, done: false }] });
    setNewCheckItem("");
  }

  function updateChecklistItem(id, patch) {
    setF({ ...f, checklist: (f.checklist || []).map(item => item.id === id ? { ...item, ...patch } : item) });
  }

  function removeChecklistItem(id) {
    setF({ ...f, checklist: (f.checklist || []).filter(item => item.id !== id) });
  }

  async function handleSave() {
    if (!f.title.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      await onSave({ ...f, title: f.title.trim(), id: initial?.id });
    } catch (err) {
      console.error("Task save failed:", err);
      setError(err?.message || "No se pudo guardar la tarea. Revisa permisos o el board activo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">{initial ? "Editar tarea" : "Nueva tarea"}</h2>
      <input placeholder="Título" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-slate-900 transition-colors" autoFocus />
      <textarea placeholder="Descripción (opcional)" value={f.description || ""} onChange={e => setF({ ...f, description: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-slate-900 transition-colors" rows={2} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select value={f.module} onChange={e => setF({ ...f, module: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-slate-900">{modules.map(m => <option key={m} value={m}>{m}</option>)}</select>
        <select value={f.phase} onChange={e => setF({ ...f, phase: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-slate-900">{Object.entries(phaseMap).map(([k, v]) => <option key={k} value={k}>{k} - {v}</option>)}</select>
        <select value={f.priority} onChange={e => setF({ ...f, priority: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-slate-900"><option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option></select>
        <select value={f.effort} onChange={e => setF({ ...f, effort: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-slate-900"><option value="Alto">Alto</option><option value="Medio">Medio</option><option value="Bajo">Bajo</option></select>
      </div>
      <input value={f.dueDate || ""} onChange={e => setF({ ...f, dueDate: e.target.value })} type="date" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-slate-900 transition-colors" />
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
        <h3 className="text-xs font-black uppercase text-slate-400">Campos IT</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select value={f.system || ""} onChange={e => setF({ ...f, system: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-cyan-400">
            {itConfig.systems.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={f.ticketType || ""} onChange={e => setF({ ...f, ticketType: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-cyan-400">
            {itConfig.ticketTypes.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <input value={f.requester || ""} onChange={e => setF({ ...f, requester: e.target.value })} placeholder="Solicitante" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-cyan-400" />
          <input value={f.slaHours || ""} onChange={e => setF({ ...f, slaHours: Number(e.target.value) || "" })} type="number" min="1" placeholder="SLA horas" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-cyan-400" />
          {isLocal && (
            <select value={f.assignedName || ""} onChange={e => setF({ ...f, assignedTo: e.target.value ? `local-${e.target.value}` : "", assignedName: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-cyan-400">
              <option value="">Sin asignar</option>
              {itConfig.team.map(v => <option key={v} value={v}>Asignar: {v}</option>)}
            </select>
          )}
          <select value={f.impact || ""} onChange={e => setF({ ...f, impact: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-cyan-400">
            {itConfig.impacts.map(v => <option key={v} value={v}>Impacto: {v}</option>)}
          </select>
          <select value={f.urgency || ""} onChange={e => setF({ ...f, urgency: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-cyan-400">
            {itConfig.urgencies.map(v => <option key={v} value={v}>Urgencia: {v}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase text-slate-400">Checklist</h4>
          {(f.checklist || []).map(item => (
            <div key={item.id} className="flex items-center gap-2">
              <input type="checkbox" checked={!!item.done} onChange={e => updateChecklistItem(item.id, { done: e.target.checked })} />
              <input value={item.text} onChange={e => updateChecklistItem(item.id, { text: e.target.value })} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-cyan-400" />
              <button type="button" onClick={() => removeChecklistItem(item.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <div className="flex gap-2">
            <input value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCheckItem(); } }} placeholder="Agregar item de checklist" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-cyan-400" />
            <button type="button" onClick={addCheckItem} className="rounded-lg bg-cyan-600 px-3 text-xs font-bold text-white">Agregar</button>
          </div>
        </div>
      </div>
      {isAdmin && users.length > 0 && (
        <select value={f.assignedTo} onChange={e => {
          const u = users.find(u => u.id === e.target.value);
          setF({ ...f, assignedTo: e.target.value, assignedName: u ? u.name : "" });
        }} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-slate-900">
          <option value="">Sin asignar</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
        </select>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={handleSave} disabled={!f.title.trim() || saving} className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition-colors">{saving ? "Guardando..." : initial ? "Actualizar" : "Agregar"}</button>
        <button type="button" onClick={onClose} disabled={saving} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">Cancelar</button>
      </div>
    </div>
  );
}

function TaskDetail({ task, onDelete, onClose, onStatus, isAdmin, onArchive, activeBoardId, users, onTaskPatch, itConfig = defaultItConfig, isLocal = false, deletingId }) {
  const [logs, setLogs] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const { user, userData } = useAuth();
  const isLocalDetailDemo = !user && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const detailUser = user || (isLocalDetailDemo ? { uid: "local-demo-user", email: "demo@norahr.local" } : null);
  const detailUserData = userData || (isLocalDetailDemo ? { name: "Demo NoraHR" } : null);
  const statusOrder = ["Pendiente", "En progreso", "Bloqueado", "Hecho"];
  const currentIdx = statusOrder.indexOf(task.status);
  const progress = currentIdx < 0 ? 0 : Math.round((currentIdx / (statusOrder.length - 1)) * 100);
  const status = statusMeta[task.status] || statusMeta.Pendiente;
  const StatusIcon = status.icon;
  const priority = priorityMeta[task.priority] || priorityMeta.Media;
  const PriorityIcon = priority.icon;
  const operationalKey = getOperationalState(task);
  const operationalMeta = operationalStates[operationalKey] || operationalStates.normal;
  const OperationalIcon = operationalMeta.icon;

  const availableStatuses = isAdmin
    ? statuses.filter(s => s !== task.status)
    : statuses.filter(s => {
        const targetIdx = statusOrder.indexOf(s);
        return targetIdx > currentIdx && s !== "Bloqueado";
      });

  const slaCompliance = useMemo(() => {
    if (!task.slaHours || !task.dueDate) return null;
    const now = new Date();
    const due = new Date(task.dueDate);
    const diffMs = due - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    const totalSla = task.slaHours;
    const remainingPct = Math.round((diffHours / totalSla) * 100);
    if (task.status === "Hecho") return { status: "completado", label: "Completado", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    if (diffMs < 0) return { status: "vencido", label: "Vencido", color: "text-red-600 bg-red-50 border-red-200", remainingPct: 0 };
    if (remainingPct <= 25) return { status: "por-vencer", label: "Por vencer", color: "text-amber-600 bg-amber-50 border-amber-200", remainingPct };
    return { status: "en-plazo", label: "En plazo", color: "text-emerald-600 bg-emerald-50 border-emerald-200", remainingPct };
  }, [task.slaHours, task.dueDate, task.status]);

  function InlineField({ label, children }) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
        {children}
      </div>
    );
  }

  useEffect(() => {
    if (!activeBoardId && task.id) {
      const allLogs = readLocalJSON(LOCAL_LOGS_KEY, {});
      setLogs(allLogs[task.id] || []);
      const all = readLocalJSON(LOCAL_COMMENTS_KEY, {});
      setComments(all[task.id] || []);
      return;
    }
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

  useEffect(() => {
    if (activeBoardId && task.id) {
      const q = query(
        collection(db, "boards", activeBoardId, "tasks", task.id, "comments"),
        orderBy("createdAt", "asc"),
        limit(100)
      );
      const unsub = onSnapshot(q, (snap) => {
        setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        console.error("Comments listener error:", err);
      });
      return unsub;
    }
  }, [task.id, activeBoardId]);

  async function sendComment(e) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || !detailUser) return;
    if (!activeBoardId) {
      const nextComment = {
        id: `local-comment-${Date.now()}`,
        text,
        userId: detailUser.uid,
        userName: detailUserData?.name || detailUser.email,
        createdAt: new Date().toISOString(),
      };
      const all = readLocalJSON(LOCAL_COMMENTS_KEY, {});
      const next = { ...all, [task.id]: [...(all[task.id] || []), nextComment] };
      writeLocalJSON(LOCAL_COMMENTS_KEY, next);
      setComments(next[task.id]);
      setCommentText("");
      return;
    }
    try {
      await addDoc(collection(db, "boards", activeBoardId, "tasks", task.id, "comments"), {
        text,
        userId: user.uid,
        userName: userData?.name || user.email,
        createdAt: serverTimestamp(),
      });
      setCommentText("");
    } catch (err) {
      console.error("Error creating comment:", err);
    }
  }

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

  function updateField(field, value) {
    if (!isAdmin) return;
    onTaskPatch?.(task.id, { [field]: value });
  }

  function markDone() {
    if (task.status === "Hecho") {
      onStatus(task.id, "En progreso");
      return;
    }
    const currentChecklist = checklistProgress(task);
    if (currentChecklist.total > 0 && currentChecklist.done < currentChecklist.total) {
      const ok = confirm(`El checklist está incompleto (${currentChecklist.done}/${currentChecklist.total}). ¿Marcar como hecho de todos modos?`);
      if (!ok) return;
    }
    onStatus(task.id, "Hecho");
  }

  function assignToMe() {
    if (!detailUser) return;
    onTaskPatch?.(task.id, {
      assignedTo: detailUser.uid,
      assignedName: detailUserData?.name || detailUser.email,
    });
  }

  function patchChecklist(checklist) {
    onTaskPatch?.(task.id, { checklist });
  }

  function toggleCheckItem(id) {
    patchChecklist((task.checklist || []).map(item => item.id === id ? { ...item, done: !item.done } : item));
  }

  function addChecklistItem() {
    const text = prompt("Nuevo item de checklist");
    if (!text?.trim()) return;
    patchChecklist([...(task.checklist || []), { id: `check-${Date.now()}`, text: text.trim(), done: false }]);
  }

  function updateChecklistItem(id, text) {
    patchChecklist((task.checklist || []).map(item => item.id === id ? { ...item, text } : item));
  }

  function removeChecklistItem(id) {
    patchChecklist((task.checklist || []).filter(item => item.id !== id));
  }

  function goToSection(id, tab = "details") {
    setActiveTab(tab);
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  const checklist = checklistProgress(task);

  const mutedInput = "w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-cyan-400";
  const readonlyText = "mt-1 truncate text-xs font-bold text-slate-700";

  const commentsPanel = (
    <div className="flex min-h-[420px] flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Actividad</h3>
          <p className="text-xs text-slate-400">{comments.length} comentarios · {logs.length} eventos</p>
        </div>
        <MessageSquare className="h-5 w-5 text-slate-300" />
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        {comments.map(c => (
          <div key={c.id} className="flex gap-3">
            <Avatar name={c.userName} />
            <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-4 py-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-bold text-slate-800">{c.userName}</span>
                <span className="shrink-0 text-[10px] text-slate-400">{formatTimestamp(c.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{c.text}</p>
            </div>
          </div>
        ))}

        {logs.map(l => (
          <div key={l.id} className="flex gap-3 text-sm">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-300" />
            <div>
              <span className="font-semibold text-slate-700">{l.userName}</span>{" "}
              <span className="text-slate-500">{actionLabels[l.action] || l.action}</span>
              {l.details && <span className="text-slate-400"> · {l.details}</span>}
              <span className="ml-1 text-xs text-slate-300">{formatTimestamp(l.createdAt)}</span>
            </div>
          </div>
        ))}

        {comments.length === 0 && logs.length === 0 && (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center text-slate-300">
            <MessageSquare className="mb-3 h-12 w-12" />
            <p className="text-sm font-semibold">No hay actividad todavía</p>
            <p className="mt-1 max-w-sm text-sm">Comenta o cambia el estado para iniciar la conversación.</p>
          </div>
        )}
      </div>
      <form onSubmit={sendComment} className="m-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <MessageSquare className="ml-2 h-4 w-4 text-slate-300" />
        <input
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          placeholder="Comenta o menciona contexto para esta tarea..."
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-xs outline-none placeholder:text-slate-300"
        />
        <button disabled={!commentText.trim()} className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-600 text-white transition-colors hover:bg-cyan-700 disabled:bg-slate-200">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex h-[92vh] min-h-[620px] flex-col overflow-hidden rounded-2xl bg-white text-slate-900">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4">
        <div className="flex min-w-0 items-center gap-1">
          {[
            ["details", "Card details"],
            ["activity", "Activity"],
            ["timing", "Timing"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`h-14 border-b-2 px-4 text-sm font-bold transition-colors ${activeTab === key ? "border-cyan-600 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-700"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setActiveTab("activity")} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-50 hover:text-slate-700">
            <MessageSquare className="h-5 w-5" />
          </button>
          <button onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-100/80 px-4 py-3">
        <button
          onClick={markDone}
          className="flex items-center gap-3 rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50"
        >
          <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-black ${task.status === "Hecho" ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-emerald-600"}`}>
            {progress}
          </span>
          {task.status === "Hecho" ? "Reopen" : "Mark as done"}
        </button>
        <div className="flex items-center gap-2 text-slate-400">
          {isAdmin && (
            <button onClick={() => onArchive(task.id, !task.archived)} disabled={deletingId === task.id} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white hover:text-slate-700 disabled:opacity-40" title={task.archived ? "Restaurar" : "Archivar"}>
              <Archive className="h-5 w-5" />
            </button>
          )}
          {isAdmin && (
            <button onClick={() => { if (confirm("¿Eliminar esta tarea?")) { onDelete(task.id); onClose(); } }} disabled={deletingId === task.id} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white hover:text-red-600 disabled:opacity-40" title="Eliminar">
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <button onClick={() => setActiveTab("details")} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white hover:text-slate-700" title="Detalles">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col bg-slate-100/70 lg:flex-row">
        <main className="min-h-0 flex-1 overflow-y-auto">
          {activeTab === "details" && (
            <div className="grid min-h-full lg:grid-cols-[minmax(360px,42%)_1fr]">
              <div className="border-r border-slate-200 bg-white">
                <section className="space-y-5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar name={task.assignedName || detailUserData?.name || detailUser?.email} size="lg" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-400">{task.updatedAt ? `Actualizada ${formatTimestamp(task.updatedAt)}` : "Detalle de tarea"}</p>
                        {isAdmin ? (
                          <textarea
                            value={task.title || ""}
                            onChange={e => updateField("title", e.target.value)}
                            rows={2}
                            className="mt-1 w-full resize-none rounded-lg border border-transparent bg-transparent px-1 text-2xl font-bold leading-tight text-slate-950 outline-none hover:border-slate-200 focus:border-cyan-400"
                          />
                        ) : (
                          <h2 className="mt-1 text-2xl font-bold leading-tight text-slate-950">{task.title}</h2>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <FieldPill icon={StatusIcon} className={status.soft}>{task.status}</FieldPill>
                      <FieldPill icon={OperationalIcon} className={operationalMeta.tone}>{operationalMeta.label}</FieldPill>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <InlineField label="List">
                      {isAdmin ? (
                        <select value={task.status || "Pendiente"} onChange={e => onStatus(task.id, e.target.value)} className={mutedInput}>
                          {statuses.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      ) : <p className={readonlyText}>{task.status}</p>}
                    </InlineField>
                    <InlineField label="Priority">
                      {isAdmin ? (
                        <select value={task.priority || "Media"} onChange={e => updateField("priority", e.target.value)} className={mutedInput}>
                          {Object.keys(priorityMeta).map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      ) : <p className={readonlyText}>{task.priority}</p>}
                    </InlineField>
                    <InlineField label="System">
                      {isAdmin ? (
                        <select value={task.system || ""} onChange={e => updateField("system", e.target.value)} className={mutedInput}>
                          <option value="">Sin definir</option>
                          {itConfig.systems.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      ) : <p className={readonlyText}>{task.system || "Sin definir"}</p>}
                    </InlineField>
                    <InlineField label="Type">
                      {isAdmin ? (
                        <select value={task.ticketType || ""} onChange={e => updateField("ticketType", e.target.value)} className={mutedInput}>
                          <option value="">Sin definir</option>
                          {itConfig.ticketTypes.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      ) : <p className={readonlyText}>{task.ticketType || "Sin definir"}</p>}
                    </InlineField>
                    <InlineField label="Decisión manager">
                      {isAdmin ? (
                        <select value={task.operationalState || "normal"} onChange={e => updateField("operationalState", e.target.value)} className={mutedInput}>
                          {Object.entries(operationalStates).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                        </select>
                      ) : <p className={readonlyText}>{operationalMeta.label}</p>}
                    </InlineField>
                    <InlineField label="Motivo bloqueo">
                      {isAdmin ? (
                        <input value={task.blockedReason || ""} onChange={e => updateField("blockedReason", e.target.value)} placeholder="Dependencia, proveedor, acceso..." className={mutedInput} />
                      ) : <p className={readonlyText}>{task.blockedReason || "Sin motivo"}</p>}
                    </InlineField>
                  </div>

                  <div id="task-description" className="rounded-xl border border-slate-200">
                    <div className="border-b border-slate-200 px-4 py-3">
                      <h3 className="text-xs font-bold uppercase text-slate-400">Description</h3>
                    </div>
                    {isAdmin ? (
                      <textarea
                        value={task.description || ""}
                        onChange={e => updateField("description", e.target.value)}
                        rows={4}
                        placeholder="Add description"
                        className="min-h-[116px] w-full resize-none rounded-b-xl bg-white px-4 py-4 text-sm leading-7 text-slate-600 outline-none placeholder:text-slate-300 focus:bg-slate-50"
                      />
                    ) : (
                      <p className="min-h-[96px] px-4 py-4 text-sm leading-7 text-slate-600">{task.description || "Sin descripción"}</p>
                    )}
                  </div>

                  <section id="task-assignees" className="scroll-mt-4 border-t border-slate-200 pt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-900">Assignees</h3>
                      {(!task.assignedTo && !task.assignedName && isAdmin) ? (
                        <button onClick={assignToMe} className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-700">Asignarme</button>
                      ) : (
                        <Users className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                    {isLocal ? (
                      <select
                        value={task.assignedName || ""}
                        onChange={e => {
                          const name = e.target.value;
                          onTaskPatch?.(task.id, { assignedName: name, assignedTo: name ? `local-${name}` : "" });
                        }}
                        className={mutedInput}
                      >
                        <option value="">Sin asignar</option>
                        {itConfig.team.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    ) : isAdmin && users?.length > 0 ? (
                      <select
                        value={task.assignedTo || ""}
                        onChange={e => {
                          const userId = e.target.value;
                          const u = users.find(uu => uu.id === userId);
                          onTaskPatch?.(task.id, { assignedTo: userId, assignedName: u ? u.name : "" });
                        }}
                        className={mutedInput}
                      >
                        <option value="">Sin asignar</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                      </select>
                    ) : (
                      <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                        {task.assignedName ? <Avatar name={task.assignedName} /> : <User className="h-5 w-5 text-slate-300" />}
                        <span className="text-sm font-semibold text-slate-700">{task.assignedName || "Sin asignar"}</span>
                      </div>
                    )}
                  </section>

                  <section id="task-dates" className="scroll-mt-4 border-t border-slate-200 pt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black text-slate-900">Start & Due date</h3>
                        <p className="text-xs text-slate-400">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Sin fecha límite"}</p>
                      </div>
                      <Calendar className="h-5 w-5 text-slate-300" />
                    </div>
                    {isAdmin ? (
                      <input type="date" value={task.dueDate || ""} onChange={e => updateField("dueDate", e.target.value)} className={mutedInput} />
                    ) : task.dueDate ? (
                      <DueDateBadge dueDate={task.dueDate} />
                    ) : (
                      <p className="text-sm text-slate-400">Sin fecha límite</p>
                    )}
                  </section>

                  <section id="task-checklist" className="scroll-mt-4 border-t border-slate-200 pt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black text-slate-900">Checklist</h3>
                        <p className="text-xs text-slate-400">{checklist.done}/{checklist.total} completado</p>
                      </div>
                      {isAdmin && <button onClick={addChecklistItem} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-cyan-600 hover:text-white"><Plus className="h-4 w-4" /></button>}
                    </div>
                    <div className="space-y-2">
                      {(task.checklist || []).map(item => (
                        <div key={item.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                          <button type="button" onClick={() => isAdmin && toggleCheckItem(item.id)} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${item.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent"}`}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                          {isAdmin ? (
                            <input value={item.text} onChange={e => updateChecklistItem(item.id, e.target.value)} className={`min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none ${item.done ? "text-slate-400 line-through" : "text-slate-700"}`} />
                          ) : (
                            <span className={`min-w-0 flex-1 text-sm font-semibold ${item.done ? "text-slate-400 line-through" : "text-slate-700"}`}>{item.text}</span>
                          )}
                          {isAdmin && <button onClick={() => removeChecklistItem(item.id)} className="text-slate-300 hover:text-red-500"><X className="h-4 w-4" /></button>}
                        </div>
                      ))}
                      {(!task.checklist || task.checklist.length === 0) && <p className="text-sm text-slate-400">Sin checklist todavía.</p>}
                    </div>
                  </section>

                  <section id="task-properties" className="scroll-mt-4 border-t border-slate-200 pt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-900">Custom properties</h3>
                      <SlidersHorizontal className="h-5 w-5 text-slate-300" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {isAdmin ? (
                        <>
                          <InlineField label="Module">
                            <select value={task.module || ""} onChange={e => updateField("module", e.target.value)} className={mutedInput}>
                              {modules.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          </InlineField>
                          <InlineField label="Phase">
                            <select value={task.phase || "V1"} onChange={e => updateField("phase", e.target.value)} className={mutedInput}>
                              {Object.keys(phaseMap).map(v => <option key={v} value={v}>{v} - {phaseMap[v]}</option>)}
                            </select>
                          </InlineField>
                          <InlineField label="Impact">
                            <select value={task.impact || ""} onChange={e => updateField("impact", e.target.value)} className={mutedInput}>
                              <option value="">Sin definir</option>
                              {itConfig.impacts.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          </InlineField>
                          <InlineField label="Urgency">
                            <select value={task.urgency || ""} onChange={e => updateField("urgency", e.target.value)} className={mutedInput}>
                              <option value="">Sin definir</option>
                              {itConfig.urgencies.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          </InlineField>
                          <InlineField label="Effort">
                            <select value={task.effort || "Medio"} onChange={e => updateField("effort", e.target.value)} className={mutedInput}>
                              {Object.keys(effortWeight).map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          </InlineField>
                          <InlineField label="SLA hours">
                            <input value={task.slaHours || ""} onChange={e => updateField("slaHours", Number(e.target.value) || "")} type="number" min="1" className={mutedInput} />
                          </InlineField>
                        </>
                      ) : (
                        <>
                          {[
                            ["Module", task.module || "Sin definir"],
                            ["Phase", task.phase ? `${task.phase} - ${phaseMap[task.phase]}` : "Sin definir"],
                            ["Impact", task.impact || "Sin definir"],
                            ["Urgency", task.urgency || "Sin definir"],
                            ["Effort", task.effort || "Sin definir"],
                            ["SLA", task.slaHours ? `${task.slaHours}h` : "Sin definir"],
                          ].map(([label, value]) => (
                            <InlineField key={label} label={label}><p className={readonlyText}>{value}</p></InlineField>
                          ))}
                        </>
                      )}
                    </div>
                  </section>
                </section>
              </div>
              <div className="min-h-0 p-4">{commentsPanel}</div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="mx-auto max-w-4xl p-4">{commentsPanel}</div>
          )}

          {activeTab === "timing" && (
            <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-950">Timing</h3>
                  <Clock3 className="h-5 w-5 text-slate-300" />
                </div>
                <div className="mb-2 flex justify-between text-xs font-semibold text-slate-400">
                  <span>{task.status}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${status.accent}`} style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <InlineField label="Due date">
                    {isAdmin ? <input type="date" value={task.dueDate || ""} onChange={e => updateField("dueDate", e.target.value)} className={mutedInput} /> : <p className={readonlyText}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Sin fecha"}</p>}
                  </InlineField>
                  <InlineField label="Última actualización"><p className={readonlyText}>{task.updatedAt ? formatTimestamp(task.updatedAt) : "Sin registro"}</p></InlineField>
                  <InlineField label="Creada"><p className={readonlyText}>{task.createdAt ? formatTimestamp(task.createdAt) : "Sin registro"}</p></InlineField>
                  <InlineField label="Esfuerzo"><p className={readonlyText}>{task.effort}</p></InlineField>
                  <InlineField label="SLA">
                    <p className={readonlyText}>{task.slaHours ? `${task.slaHours} horas` : "Sin definir"}</p>
                    {slaCompliance && <span className={`mt-1 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${slaCompliance.color}`}>{slaCompliance.label}</span>}
                  </InlineField>
                  <InlineField label="Checklist"><p className={readonlyText}>{checklist.done}/{checklist.total} completado</p></InlineField>
                </div>
              </section>
            </div>
          )}
        </main>

        <aside className="shrink-0 border-l border-slate-200 bg-slate-50 p-4 lg:w-72">
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Resumen</span>
                <MoreVertical className="h-4 w-4 text-slate-300" />
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-500"><Users className="h-4 w-4" />Assignees</span>
                  <span className="font-bold text-slate-800">{task.assignedName ? 1 : 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-500"><MessageSquare className="h-4 w-4" />Comments</span>
                  <span className="font-bold text-slate-800">{comments.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-500"><Archive className="h-4 w-4" />Archived</span>
                  <span className="font-bold text-slate-800">{task.archived ? "Sí" : "No"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-500"><OperationalIcon className="h-4 w-4" />Decisión</span>
                  <span className="font-bold text-slate-800">{operationalMeta.label}</span>
                </div>
              </div>
            </div>

            {availableStatuses.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase text-slate-400">Mover estado</h4>
                <div className="space-y-2">
                  {availableStatuses.map(s => {
                    const M = statusMeta[s]?.icon || Circle;
                    return (
                      <button key={s} onClick={() => onStatus(task.id, s)} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:border-cyan-200 hover:text-cyan-700">
                        <M className="h-4 w-4" />
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h4 className="mb-2 text-xs font-bold uppercase text-slate-400">Acciones</h4>
              <div className="space-y-2">
                {[
                  [Users, "Asignar responsable", () => goToSection("task-assignees")],
                  [CheckCircle2, isAdmin ? "Agregar checklist" : "Ver checklist", () => { goToSection("task-checklist"); if (isAdmin) window.setTimeout(addChecklistItem, 120); }],
                  [Calendar, "Abrir fecha / SLA", () => setActiveTab("timing")],
                  [SlidersHorizontal, "Propiedades IT", () => goToSection("task-properties")],
                  [MessageSquare, "Abrir comentarios", () => setActiveTab("activity")],
                  [Clock3, "Abrir timing", () => setActiveTab("timing")],
                ].map(([Icon, label, action]) => (
                  <button key={label} onClick={action} className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-600 transition-colors hover:border-cyan-200 hover:text-cyan-700">
                    <Icon className="h-4 w-4 text-slate-400" />
                    {label}
                  </button>
                ))}

                {isAdmin && (
                  <>
                    <button onClick={() => onArchive(task.id, !task.archived)} disabled={deletingId === task.id} className="flex w-full items-center gap-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-left text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-40">
                      <Archive className="h-4 w-4" /> {task.archived ? "Restaurar tarea" : "Archivar tarea"}
                    </button>
                    <button onClick={() => { if (confirm("¿Eliminar esta tarea?")) { onDelete(task.id); onClose(); } }} disabled={deletingId === task.id} className="flex w-full items-center gap-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-40">
                      <Trash2 className="h-4 w-4" /> Eliminar tarea
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ITConfigPanel({ config, onSave, onReset, onClose }) {
  const [draft, setDraft] = useState(config);

  function updateList(key, value) {
    setDraft({ ...draft, [key]: value.split("\n").map(v => v.trim()).filter(Boolean) });
  }

  const sections = [
    ["systems", "Sistemas"],
    ["ticketTypes", "Tipos de tarea"],
    ["impacts", "Impacto"],
    ["urgencies", "Urgencia"],
    ["team", "Equipo"],
    ["jobTitles", "Puestos IT"],
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-950">Configuración IT</h2>
          <p className="text-sm text-slate-400">Catálogos locales para el kanban corporativo de IT.</p>
        </div>
        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map(([key, label]) => (
          <label key={key} className="space-y-2">
            <span className="text-xs font-black uppercase text-slate-400">{label}</span>
            <textarea
              value={(draft[key] || []).join("\n")}
              onChange={e => updateList(key, e.target.value)}
              className="h-32 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-cyan-400"
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => { onSave(draft); onClose(); }} className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700">
          <Save className="h-4 w-4" /> Guardar configuración
        </button>
        <button onClick={onReset} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" /> Reset demo local
        </button>
      </div>
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
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);

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
      } else if (err.code === "auth/too-many-requests") {
        setError("Demasiados intentos. Intenta de nuevo más tarde.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Error de conexión. Verifica tu internet.");
      } else if (err.code === "auth/user-disabled") {
        setError("Esta cuenta ha sido deshabilitada.");
      } else {
        setError("Error al iniciar sesión. Verifica tus credenciales.");
      }
    }
    setSubmitting(false);
  }

  async function handleReset() {
    if (!email.trim()) { setError("Ingresa tu correo primero"); return; }
    setSubmitting(true);
    setError("");
    try {
      const { sendPasswordResetEmail } = await import("firebase/auth");
      const { auth } = await import("./firebase");
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No hay cuenta con este correo");
      } else {
        setError("Error al enviar el correo. Intenta de nuevo.");
      }
    }
    setSubmitting(false);
  }

  if (resetSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] p-4">
        <div className="w-full max-w-sm rounded-2xl border bg-white p-8 text-center shadow-lg">
          <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white">✓</span>
          <h1 className="mt-3 text-lg font-bold text-slate-900">Correo enviado</h1>
          <p className="mt-2 text-sm text-slate-500">Revisa tu bandeja de entrada para restablecer tu contraseña.</p>
          <button onClick={() => { setResetSent(false); setShowReset(false); setError(""); }} className="mt-6 text-sm text-blue-600 hover:underline font-medium">Volver al inicio de sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 text-lg font-bold text-white">N</span>
          <h1 className="mt-3 text-lg font-bold text-slate-900">NoraHR Roadmap</h1>
          <p className="text-sm text-slate-400">{showReset ? "Restablecer contraseña" : mode === "login" ? "Inicia sesión para continuar" : "Crea tu cuenta"}</p>
        </div>
        {showReset ? (
          <div className="space-y-4">
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Tu correo electrónico" type="email" required autoComplete="email"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs outline-none focus:border-slate-900 transition-colors" />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button onClick={handleReset} disabled={submitting}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition-colors">
              {submitting ? "Enviando..." : "Enviar correo de recuperación"}
            </button>
            <button type="button" onClick={() => { setShowReset(false); setError(""); }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-700">Volver</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs outline-none focus:border-slate-900 transition-colors" />
            )}
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo electrónico" type="email" required autoComplete="email"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs outline-none focus:border-slate-900 transition-colors" />
            {mode === "login" && (
              <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" type="password" required autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs outline-none focus:border-slate-900 transition-colors" />
            )}
            {mode === "signup" && (
              <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" type="password" required autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs outline-none focus:border-slate-900 transition-colors" />
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button type="submit" disabled={submitting}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition-colors">
              {submitting ? "..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </button>
            {mode === "login" && (
              <button type="button" onClick={() => setShowReset(true)}
                className="w-full text-center text-xs text-slate-400 hover:text-blue-600 transition-colors">
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </form>
        )}
        {!showReset && (
          <p className="mt-4 text-center text-xs text-slate-500">
            {mode === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
              className="text-blue-600 hover:underline font-medium">
              {mode === "login" ? "Crear cuenta" : "Iniciar sesión"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

function AdminPanel({ users, currentUser, onClose, itConfig = defaultItConfig }) {
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

  async function updateJobTitle(uid, jobTitle) {
    setUpdating(p => ({ ...p, [uid]: true }));
    try {
      await updateDoc(doc(db, "users", uid), { jobTitle });
    } catch (e) {
      alert("Error al actualizar puesto");
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
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Settings className="h-5 w-5 text-slate-400" /> Administrar usuarios</h2>
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
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${u.role === "admin" ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-600"}`}>{u.role}</span>
              <select value={u.jobTitle || ""} onChange={e => updateJobTitle(u.id, e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 outline-none focus:border-cyan-400"
                disabled={updating[u.id]}>
                <option value="">Sin puesto</option>
                {(itConfig.jobTitles || []).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
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
  const isLocalDemo = !user && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const appUser = user || (isLocalDemo ? { uid: "local-demo-user", email: "demo@norahr.local" } : null);
  const appUserData = userData || (isLocalDemo ? { name: "Demo NoraHR", role: "admin", email: "demo@norahr.local" } : null);
  const appIsAdmin = isAdmin || isLocalDemo;
  const appActiveBoardId = activeBoardId || (isLocalDemo ? "local-demo-board" : null);
  const appBoards = boards.length > 0 ? boards : (isLocalDemo ? [{ id: "local-demo-board", name: "NoraHR Roadmap" }] : boards);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mod, setMod] = useState("Todos");
  const [prio, setPrio] = useState("Todas");
  const [phase, setPhase] = useState("Todas");
  const [systemFilter, setSystemFilter] = useState("Todos");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [slaFilter, setSlaFilter] = useState("Todos");
  const [responsibleFilter, setResponsibleFilter] = useState("Todos");
  const [opsFilter, setOpsFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState("Pendiente");
  const [editT, setEditT] = useState(null);
  const [detailT, setDetailT] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [showAdmin, setShowAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [viewMode, setViewMode] = useState("board");
  const [myWorkOnly, setMyWorkOnly] = useState(false);
  const [commentsOnly, setCommentsOnly] = useState(false);
  const [showItConfig, setShowItConfig] = useState(false);
  const [itConfig, setItConfig] = useState(() => readLocalJSON(LOCAL_IT_CONFIG_KEY, defaultItConfig));
  const [activeId, setActiveId] = useState(null);
  const [commentTaskIds, setCommentTaskIds] = useState([]);
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg) => setToast(msg), []);
  const [deletingId, setDeletingId] = useState(null);
  const appUserLevel = isLocalDemo ? "manager" : (itConfig.jobTitleHierarchy || {})[appUserData?.jobTitle || ""] || "viewer";
  const appCanCreate = appIsAdmin || appUserLevel === "manager" || appUserLevel === "admin";
  const appCanEdit = appCanCreate || appUserLevel === "editor";
  const activeTask = useMemo(() => tasks.find(t => t.id === activeId), [activeId, tasks]);
  const seeded = useRef({});
  const migrated = useRef(false);
  const boardsRef = useRef(appBoards);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const localLoaded = useRef(false);
  boardsRef.current = appBoards;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (isLocalDemo) {
      const saved = readLocalJSON(LOCAL_TASKS_KEY, null);
      const localTasks = Array.isArray(saved) && saved.length
        ? saved.map((t, idx) => enrichLocalTask(t, idx, itConfig))
        : initialTasks.map((t, idx) => enrichLocalTask(t, idx, itConfig));
      setTasks(localTasks);
      localLoaded.current = true;
      return;
    }
    if (!user || !activeBoardId) return;
    const q = query(collection(db, "boards", activeBoardId, "tasks"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const ts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTasks(ts);
      tasksRef.current = ts;
      setDetailT(prev => {
        if (!prev) return prev;
        const updated = ts.find(t => t.id === prev.id);
        return updated || prev;
      });
      const missingOrder = ts.filter(t => t.order === undefined || t.order === null);
      if (missingOrder.length > 0) {
        Promise.allSettled(
          missingOrder.map(t =>
            updateDoc(doc(db, "boards", activeBoardId, "tasks", t.id), { order: Date.now() })
          )
        );
      }
      const adminName = userData?.name || user.email;
      const unassigned = appIsAdmin ? ts.filter(t => !t.assignedTo && !t.assignedName) : [];
      if (unassigned.length > 0) {
        Promise.allSettled(
          unassigned.map(t =>
            updateDoc(doc(db, "boards", activeBoardId, "tasks", t.id), {
              assignedTo: user.uid,
              assignedName: adminName,
              createdBy: t.createdBy || user.uid,
              updatedAt: serverTimestamp(),
            })
          )
        );
      }
      if (snap.empty && appIsAdmin && !seeded.current[activeBoardId]) {
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
                    assignedTo: user.uid,
                    assignedName: adminName,
                    operationalState: "normal",
                    blockedReason: "",
                    ticketType: "",
                    requester: "Operaciones IT",
                    system: "",
                    impact: "Medio",
                    urgency: "Media",
                    slaHours: 72,
                    checklist: makeChecklist(data.title),
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
    }, (err) => {
      console.error("Tasks listener error:", err);
    });
    return unsub;
  }, [user, userData, appIsAdmin, activeBoardId, isLocalDemo]);

  useEffect(() => {
    if (!isLocalDemo || !localLoaded.current) return;
    writeLocalJSON(LOCAL_TASKS_KEY, tasks);
  }, [tasks, isLocalDemo]);

  useEffect(() => {
    if (!isLocalDemo) return;
    writeLocalJSON(LOCAL_IT_CONFIG_KEY, itConfig);
  }, [itConfig, isLocalDemo]);

  useEffect(() => {
    if (isLocalDemo) {
      setUsers([]);
      return;
    }
    if (!user) return;
    const unsub = onSnapshot(
      query(collection(db, "users"), limit(200)),
      (snap) => {
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error("Users listener error:", err);
      }
    );
    return unsub;
  }, [user, isLocalDemo]);

  useEffect(() => {
    if (isLocalDemo) {
      const all = readLocalJSON(LOCAL_COMMENTS_KEY, {});
      setCommentTaskIds(Object.entries(all).filter(([, comments]) => Array.isArray(comments) && comments.length > 0).map(([taskId]) => taskId));
      return;
    }
    if (!user || !activeBoardId || tasks.length === 0) {
      setCommentTaskIds([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const ids = [];
        await Promise.all(tasks.map(async (task) => {
          const snap = await getDocs(query(collection(db, "boards", activeBoardId, "tasks", task.id, "comments"), limit(1)));
          if (!snap.empty) ids.push(task.id);
        }));
        if (!cancelled) setCommentTaskIds(ids);
      } catch (e) {
        console.error("Error loading task comment filters:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [tasks, user, activeBoardId, isLocalDemo]);

  useEffect(() => {
    if (isLocalDemo || !user || !appIsAdmin || !activeBoardId || migrated.current) return;
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
  }, [user, appIsAdmin, activeBoardId, isLocalDemo]);

  const userMap = useMemo(() => {
    const m = {};
    users.forEach(u => { m[u.id] = u; });
    return m;
  }, [users]);

  const displayedTasks = useMemo(() => {
    let ts = tasks.filter(t => showArchived ? t.archived : !t.archived);
    if (myWorkOnly) {
      ts = ts.filter(t => t.assignedTo === appUser?.uid || t.assignedName === appUserData?.name);
    }
    if (commentsOnly) {
      const ids = new Set(commentTaskIds);
      ts = ts.filter(t => ids.has(t.id));
    }
    if (systemFilter !== "Todos") ts = ts.filter(t => t.system === systemFilter);
    if (typeFilter !== "Todos") ts = ts.filter(t => t.ticketType === typeFilter);
    if (responsibleFilter !== "Todos") ts = ts.filter(t => t.assignedName === responsibleFilter);
    if (slaFilter === "Con SLA") ts = ts.filter(t => t.slaHours);
    if (slaFilter === "Sin SLA") ts = ts.filter(t => !t.slaHours);
    if (slaFilter === "Vencidas") {
      ts = ts.filter(isTaskOverdue);
    }
    if (overdueOnly) {
      ts = ts.filter(isTaskOverdue);
    }
    if (opsFilter === "overdue") ts = ts.filter(isTaskOverdue);
    if (opsFilter === "blocked") ts = ts.filter(t => getOperationalState(t) === "blocked");
    if (opsFilter === "unassigned") ts = ts.filter(t => !t.assignedTo && !t.assignedName);
    if (opsFilter === "urgent") ts = ts.filter(t => t.urgency === "Crítica" || t.urgency === "Alta" || t.priority === "Alta");
    if (opsFilter === "ready") ts = ts.filter(isReadyToClose);
    ts = [...ts].sort((a, b) => {
      const rank = operationalRank(a) - operationalRank(b);
      if (rank !== 0) return rank;
      return (a.order || 0) - (b.order || 0);
    });
    return filterTasks(ts, searchQuery, mod, prio, phase);
  }, [tasks, searchQuery, mod, prio, phase, showArchived, overdueOnly, myWorkOnly, commentsOnly, commentTaskIds, appUser?.uid, appUserData?.name, systemFilter, typeFilter, responsibleFilter, slaFilter, opsFilter]);

  const operationalMetrics = useMemo(() => {
    const active = tasks.filter(t => !t.archived);
    return {
      overdue: active.filter(isTaskOverdue).length,
      blocked: active.filter(t => getOperationalState(t) === "blocked").length,
      unassigned: active.filter(t => !t.assignedTo && !t.assignedName).length,
      urgent: active.filter(t => t.urgency === "Crítica" || t.urgency === "Alta" || t.priority === "Alta").length,
      ready: active.filter(isReadyToClose).length,
    };
  }, [tasks]);

  const opsCards = useMemo(() => ([
    { key: "overdue", label: "Vencidas", value: operationalMetrics.overdue, icon: Flame, tone: "border-red-100 bg-red-50 text-red-700" },
    { key: "blocked", label: "Bloqueadas", value: operationalMetrics.blocked, icon: Lock, tone: "border-rose-100 bg-rose-50 text-rose-700" },
    { key: "unassigned", label: "Sin asignar", value: operationalMetrics.unassigned, icon: User, tone: "border-slate-200 bg-white text-slate-700" },
    { key: "urgent", label: "Alta urgencia", value: operationalMetrics.urgent, icon: Flag, tone: "border-amber-100 bg-amber-50 text-amber-700" },
    { key: "ready", label: "Cierre pendiente", value: operationalMetrics.ready, icon: CheckCircle2, tone: "border-emerald-100 bg-emerald-50 text-emerald-700" },
  ]), [operationalMetrics]);

  const overdueCount = useMemo(() => {
    return tasks.filter(t => !t.archived && isTaskOverdue(t)).length;
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
  const effortProgress = effortTotal ? Math.round((effortDone / effortTotal) * 100) : 0;

  async function createLog(taskId, taskTitle, action, details) {
    if (isLocalDemo) return;
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

  function createLocalLog(taskId, taskTitle, action, details) {
    const all = readLocalJSON(LOCAL_LOGS_KEY, {});
    const log = {
      id: `local-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      taskId,
      taskTitle,
      details: details || "",
      userName: appUserData?.name || "Demo NoraHR",
      createdAt: new Date().toISOString(),
    };
    all[taskId] = [...(all[taskId] || []), log];
    writeLocalJSON(LOCAL_LOGS_KEY, all);
  }

  async function archiveTask(id, archived) {
    setDeletingId(id);
    const currentTasks = tasksRef.current;
    const task = currentTasks.find(t => t.id === id);
    if (!task) return setDeletingId(null);
    if (isLocalDemo) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, archived } : t));
      createLocalLog(id, task.title, archived ? "archived" : "restored", "");
      setDeletingId(null);
      return;
    }
    try {
      await updateDoc(doc(db, "boards", activeBoardId, "tasks", id), { archived, updatedAt: serverTimestamp() });
      createLog(id, task.title, archived ? "archived" : "restored", "");
    } catch (e) {
      console.error("Error archiving task:", e);
      showToast("Error al archivar la tarea");
    }
    setDeletingId(null);
  }

  async function handleDragEnd(e) {
    const { active, over } = e;
    if (!over || !appIsAdmin) return;

    const currentTasks = tasksRef.current;
    const taskId = String(active.id);
    const task = currentTasks.find(t => t.id === taskId);
    if (!task) return;

    const overStr = String(over.id);
    let newStatus = null;
    let isReorder = false;

    if (overStr.startsWith("column-")) {
      newStatus = overStr.replace("column-", "");
    } else {
      const overTask = currentTasks.find(t => t.id === overStr);
      if (overTask) {
        if (overTask.status !== task.status) {
          newStatus = overTask.status;
        } else if (taskId !== overStr) {
          isReorder = true;
        }
      }
    }

    if (newStatus || isReorder) {
      const opPatch = newStatus === "Bloqueado" ? { operationalState: "blocked" } : newStatus ? { operationalState: "normal" } : {};
      const targetStatus = newStatus || task.status;
      const colTasks = currentTasks
        .filter(t => t.status === targetStatus && t.id !== taskId && !t.archived)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      let newOrder;
      if (newStatus) {
        if (overStr.startsWith("column-")) {
          newOrder = colTasks.length > 0 ? (colTasks[colTasks.length - 1].order || 0) + 1000 : Date.now();
        } else {
          const overIdx = colTasks.findIndex(t => t.id === overStr);
          if (overIdx <= 0) {
            newOrder = colTasks.length > 0 ? (colTasks[0].order || 0) - 1000 : Date.now();
          } else {
            const prev = colTasks[overIdx - 1];
            const next = colTasks[overIdx];
            newOrder = ((prev.order || 0) + (next.order || 0)) / 2;
          }
        }
      } else {
        const dropIdx = colTasks.findIndex(t => t.id === overStr);
        if (dropIdx <= 0) {
          newOrder = colTasks.length > 0 ? (colTasks[0].order || 0) - 1000 : Date.now();
        } else if (dropIdx >= colTasks.length) {
          newOrder = colTasks.length > 0 ? (colTasks[colTasks.length - 1].order || 0) + 1000 : Date.now();
        } else {
          newOrder = ((colTasks[dropIdx - 1].order || 0) + (colTasks[dropIdx].order || 0)) / 2;
        }
      }

      if (isLocalDemo) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...(newStatus ? { status: newStatus } : {}), ...opPatch, order: newOrder } : t));
        if (newStatus) createLocalLog(taskId, task.title, "status_changed", `${task.status} → ${newStatus}`);
        setActiveId(null);
        return;
      }
      try {
        const updates = { updatedAt: serverTimestamp(), order: newOrder };
        if (newStatus) updates.status = newStatus;
        Object.assign(updates, opPatch);
        await updateDoc(doc(db, "boards", activeBoardId, "tasks", taskId), updates);
        if (newStatus) createLog(taskId, task.title, "status_changed", `${task.status} → ${newStatus}`);
      } catch (e) {
        console.error("Error updating task status:", e);
        showToast("Error al actualizar el estado de la tarea");
      }
    }
    setActiveId(null);
  }

  async function updateStatus(id, s) {
    const currentTasks = tasksRef.current;
    const task = currentTasks.find(t => t.id === id);
    if (!task) return;
    const opPatch = s === "Bloqueado" ? { operationalState: "blocked" } : { operationalState: "normal" };
    const previousDetail = detailT;
    setDetailT(prev => prev && prev.id === id ? { ...prev, status: s, ...opPatch, order: Date.now() } : prev);
    if (isLocalDemo) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: s, ...opPatch, order: Date.now() } : t));
      createLocalLog(id, task.title, "status_changed", `${task.status} → ${s}`);
      return;
    }
    try {
      await updateDoc(doc(db, "boards", activeBoardId, "tasks", id), { status: s, ...opPatch, order: Date.now(), updatedAt: serverTimestamp() });
      createLog(id, task.title, "status_changed", `${task.status} → ${s}`);
    } catch (e) {
      console.error("Error updating status:", e);
      setDetailT(previousDetail);
    }
  }

  async function deleteTask(id) {
    setDeletingId(id);
    const currentTasks = tasksRef.current;
    const task = currentTasks.find(t => t.id === id);
    if (!task && !isLocalDemo) return;
    if (isLocalDemo) {
      setTasks(prev => prev.filter(t => t.id !== id));
      if (task) createLocalLog(id, task.title, "deleted", "");
      setDeletingId(null);
      return;
    }
    try {
      await deleteDoc(doc(db, "boards", activeBoardId, "tasks", id));
      if (task) createLog(id, task.title, "deleted", "");
    } catch (e) {
      console.error("Error deleting task:", e);
      showToast("Error al eliminar la tarea");
    }
    setDeletingId(null);
  }

  async function addTask(f) {
    const defaultAssigneeId = appUser?.uid || "";
    const defaultAssigneeName = appUserData?.name || appUser?.email || "";
    if (isLocalDemo) {
      const newId = `local-${Date.now()}`;
      setTasks(prev => [{
        title: f.title,
        module: f.module,
        phase: f.phase,
        priority: f.priority,
        effort: f.effort,
        description: f.description || "",
        status: newTaskStatus,
        order: Date.now(),
        dueDate: f.dueDate || "",
        archived: false,
        assignedTo: f.assignedTo || defaultAssigneeId,
        assignedName: f.assignedName || defaultAssigneeName,
        ticketType: f.ticketType || "",
        requester: f.requester || "",
        system: f.system || "",
        impact: f.impact || "",
        urgency: f.urgency || "",
        slaHours: f.slaHours || "",
        checklist: f.checklist || makeChecklist(f.title),
        operationalState: f.operationalState || "normal",
        blockedReason: f.blockedReason || "",
        id: newId,
      }, ...prev]);
      createLocalLog(newId, f.title, "created", "");
      setShowAdd(false);
      setNewTaskStatus("Pendiente");
      return;
    }
    if (!activeBoardId) {
      throw new Error("No hay un board activo para crear la tarea.");
    }
    try {
      const ref = await addDoc(collection(db, "boards", activeBoardId, "tasks"), {
        title: f.title,
        module: f.module,
        phase: f.phase,
        priority: f.priority,
        effort: f.effort,
        description: f.description || "",
        status: newTaskStatus,
        order: Date.now(),
        dueDate: f.dueDate || "",
        archived: false,
        assignedTo: f.assignedTo || defaultAssigneeId,
        assignedName: f.assignedName || defaultAssigneeName,
        ticketType: f.ticketType || "",
        requester: f.requester || "",
        system: f.system || "",
        impact: f.impact || "",
        urgency: f.urgency || "",
        slaHours: f.slaHours || "",
        checklist: f.checklist || makeChecklist(f.title),
        operationalState: f.operationalState || "normal",
        blockedReason: f.blockedReason || "",
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      createLog(ref.id, f.title, "created", "");
      setShowAdd(false);
      setNewTaskStatus("Pendiente");
    } catch (e) {
      console.error("Error adding task:", e);
      showToast("Error al crear la tarea");
      throw new Error(e?.message || "Firebase rechazó la creación de la tarea.");
    }
  }

  async function editTask(f) {
    if (isLocalDemo) {
      const { id, ...data } = f;
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
      const currentTasks = tasksRef.current;
      const task = currentTasks.find(t => t.id === id);
      createLocalLog(id, (task || f).title, "updated", "");
      setEditT(null);
      return;
    }
    if (!activeBoardId) {
      throw new Error("No hay un board activo para editar la tarea.");
    }
    try {
      const { id, ...data } = f;
      await updateDoc(doc(db, "boards", activeBoardId, "tasks", id), { ...data, updatedAt: serverTimestamp() });
      createLog(id, f.title, "updated", "");
      setEditT(null);
    } catch (e) {
      console.error("Error editing task:", e);
      showToast("Error al editar la tarea");
      throw new Error(e?.message || "Firebase rechazó la edición de la tarea.");
    }
  }

  async function patchTask(id, patch) {
    const previousDetail = detailT;
    setDetailT(prev => prev && prev.id === id ? { ...prev, ...patch } : prev);
    if (isLocalDemo) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
      const currentTasks = tasksRef.current;
      const task = currentTasks.find(t => t.id === id);
      const logTitle = patch.title || task?.title || "Tarea";
      createLocalLog(id, logTitle, "updated", `Campo: ${Object.keys(patch).join(", ")}`);
      return;
    }
    const currentTasks = tasksRef.current;
    const task = currentTasks.find(t => t.id === id);
    try {
      await updateDoc(doc(db, "boards", activeBoardId, "tasks", id), { ...patch, updatedAt: serverTimestamp() });
      if (task) createLog(id, task.title, "updated", `Campo actualizado: ${Object.keys(patch).join(", ")}`);
    } catch (e) {
      console.error("Error patching task:", e);
      setDetailT(previousDetail);
      showToast("Error al guardar los cambios");
    }
  }

  function exportCSV() {
    const headers = ["Título", "Sistema", "Tipo", "Impacto", "Urgencia", "SLA horas", "Vencimiento", "Módulo", "Fase", "Prioridad", "Esfuerzo", "Estado", "Decisión manager", "Asignado", "Solicitante", "Checklist"].map(csvCell).join(",") + "\n";
    const rows = tasks.filter(t => !t.archived).map(t => {
      const checklist = checklistProgress(t);
      const operational = operationalStates[getOperationalState(t)]?.label || "Normal";
      return [
        t.title,
        t.system || "",
        t.ticketType || "",
        t.impact || "",
        t.urgency || "",
        t.slaHours || "",
        t.dueDate || "",
        t.module,
        `${t.phase} - ${phaseMap[t.phase] || ""}`,
        t.priority,
        t.effort,
        t.status,
        operational,
        t.assignedName || "",
        t.requester || "",
        checklist.total ? `${checklist.done}/${checklist.total}` : "",
      ].map(csvCell).join(",");
    }).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "norahr-tasks.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function toggleCollapse(s) { setCollapsed(c => ({ ...c, [s]: !c[s] })); }

  function openAddTask(status = "Pendiente") {
    setNewTaskStatus(status);
    setShowAdd(true);
  }

  function resetLocalDemo() {
    if (!confirm("¿Resetear datos locales demo?")) return;
    localStorage.removeItem(LOCAL_TASKS_KEY);
    localStorage.removeItem(LOCAL_COMMENTS_KEY);
    localStorage.removeItem(LOCAL_IT_CONFIG_KEY);
    localStorage.removeItem(LOCAL_LOGS_KEY);
    setItConfig(defaultItConfig);
    setTasks(initialTasks.map((t, idx) => enrichLocalTask(t, idx, defaultItConfig)));
  }

  function handleSidebarAction(action) {
    if (action === "all") {
      setMyWorkOnly(false);
      setCommentsOnly(false);
      setShowArchived(false);
      setOverdueOnly(false);
      setSearchQuery("");
      setMod("Todos");
      setPrio("Todas");
      setPhase("Todas");
      setSystemFilter("Todos");
      setTypeFilter("Todos");
      setSlaFilter("Todos");
      setResponsibleFilter("Todos");
      setOpsFilter("all");
      setViewMode("board");
    }
    if (action === "my-work") {
      setMyWorkOnly(true);
      setCommentsOnly(false);
      setShowArchived(false);
      setOverdueOnly(false);
      setOpsFilter("all");
      setViewMode("list");
    }
    if (action === "comments") {
      setCommentsOnly(true);
      setViewMode("list");
      setMyWorkOnly(false);
      setSearchQuery("");
      setShowArchived(false);
      setOverdueOnly(false);
      setOpsFilter("all");
    }
    if (action === "notifications") {
      setShowArchived(false);
      setMyWorkOnly(false);
      setCommentsOnly(false);
      setOverdueOnly(false);
      const nextFilter =
        operationalMetrics.overdue > 0 ? "overdue" :
        operationalMetrics.blocked > 0 ? "blocked" :
        operationalMetrics.urgent > 0 ? "urgent" :
        operationalMetrics.ready > 0 ? "ready" :
        "all";
      setOpsFilter(nextFilter);
      setViewMode("list");
    }
  }

  const activeBoardName = useMemo(() => {
    const b = appBoards.find(b => b.id === appActiveBoardId);
    return b ? b.name : "NoraHR Roadmap";
  }, [appBoards, appActiveBoardId]);

  const phasesOptions = ["Todas", ...Object.keys(phaseMap)];
  const hasActiveViewFilters =
    searchQuery ||
    mod !== "Todos" ||
    prio !== "Todas" ||
    phase !== "Todas" ||
    systemFilter !== "Todos" ||
    typeFilter !== "Todos" ||
    slaFilter !== "Todos" ||
    responsibleFilter !== "Todos" ||
    opsFilter !== "all" ||
    myWorkOnly ||
    commentsOnly ||
    overdueOnly;

  function clearViewFilters() {
    setMyWorkOnly(false);
    setOverdueOnly(false);
    setSearchQuery("");
    setMod("Todos");
    setPrio("Todas");
    setPhase("Todas");
    setSystemFilter("Todos");
    setTypeFilter("Todos");
    setSlaFilter("Todos");
    setResponsibleFilter("Todos");
    setOpsFilter("all");
    setCommentsOnly(false);
  }

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

  if (!appUser) return <LoginForm />;

  return (
    <>
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setActiveId(String(e.active.id))} onDragEnd={handleDragEnd} onDragCancel={() => setActiveId(null)}>
      <div className="min-h-screen bg-slate-200/60">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
          <div className="mx-auto flex max-w-[1800px] items-center gap-3 px-3 py-1.5 md:px-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-600 text-xs font-black text-white shadow-sm">N</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-sm font-black text-slate-900">{activeBoardName}</h1>
                  <MoreVertical className="hidden h-4 w-4 text-slate-300 md:block" />
                </div>
                <div className="hidden items-center gap-1 text-[10px] font-semibold text-slate-400 sm:flex">
                  <span>{tasks.length} tareas</span>
                  <span>·</span>
                  <span>{progress}% avance</span>
                  <span>·</span>
                  <span>{effortProgress}% esfuerzo</span>
                </div>
              </div>
            </div>

            <div className="hidden h-8 items-center rounded-xl bg-slate-100 p-1 md:flex">
              <button onClick={() => setViewMode(viewMode === "list" ? "board" : "list")} className={`flex h-6 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold ${viewMode === "list" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500"}`}>
                <ListFilter className="h-4 w-4" /> {viewMode === "list" ? "Board view" : "Task list"}
              </button>
              <button onClick={() => setShowArchived(!showArchived)} className={`flex h-6 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold ${showArchived ? "bg-amber-50 text-amber-700" : "text-slate-500"}`}>
                <Archive className="h-4 w-4" /> Archive
              </button>
              {isLocalDemo && (
                <button onClick={() => setShowItConfig(true)} className="flex h-6 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-slate-500">
                  <Settings className="h-4 w-4" /> Configuración IT
                </button>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              {overdueCount > 0 && !showArchived && (
                <button onClick={() => setOverdueOnly(!overdueOnly)} className={`hidden h-8 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-bold md:flex ${overdueOnly ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-500"}`}>
                  <Flame className="h-4 w-4" /> {overdueOnly ? "Todas" : overdueCount}
                </button>
              )}
              <button onClick={() => setSidebarOpen(true)} className="flex h-8 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                <LayoutDashboard className="h-4 w-4" /> <span className="hidden sm:inline">Boards</span>
              </button>
              <div className="hidden items-center gap-2 md:flex">
                {appIsAdmin && !isLocalDemo && (
                  <button onClick={() => setShowAdmin(true)} className="flex h-8 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                    <Settings className="h-4 w-4" /> Admin
                  </button>
                )}
                <button onClick={exportCSV} className="flex h-8 items-center rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Export</button>
                {!isLocalDemo && <button onClick={logout} className="flex h-8 items-center rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50">Salir</button>}
                <Avatar name={appUserData?.name || appUser.email} />
              </div>
              <div className="relative md:hidden">
                <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
                {showMobileMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-slate-200 bg-white shadow-xl p-2 space-y-1 z-50">
                    <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-100">
                      {appUserData?.name || appUser.email}
                      <span className={`ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${appIsAdmin ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-500"}`}>{appIsAdmin ? "Admin" : "Member"}</span>
                    </div>
                    {appIsAdmin && !isLocalDemo && (
                      <button onClick={() => { setShowAdmin(true); setShowMobileMenu(false); }} className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">Admin</button>
                    )}
                    {isLocalDemo && (
                      <button onClick={() => { setShowItConfig(true); setShowMobileMenu(false); }} className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">Configuración IT</button>
                    )}
                    <button onClick={() => { setShowArchived(!showArchived); setShowMobileMenu(false); }} className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                      {showArchived ? "Activas" : "Archivadas"}
                    </button>
                    {overdueCount > 0 && !showArchived && (
                      <button onClick={() => { setOverdueOnly(!overdueOnly); setShowMobileMenu(false); }} className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                        {overdueOnly ? "Todas" : `${overdueCount} vencidas`}
                      </button>
                    )}
                    <button onClick={() => { exportCSV(); setShowMobileMenu(false); }} className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">Export CSV</button>
                    {!isLocalDemo && <button onClick={logout} className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">Salir</button>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1800px] px-3 py-3 md:px-4">
          <div className="mb-3 flex flex-col gap-2">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative min-w-[220px] flex-1 lg:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar tarea, sistema o solicitante..." className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none transition-colors focus:border-cyan-300" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {appCanCreate && (
                  <button aria-label="Crear tarea" onClick={() => openAddTask()} className="flex h-9 items-center gap-2 rounded-xl bg-cyan-600 px-3 text-xs font-black text-white hover:bg-cyan-700 transition-colors">
                    <Plus className="h-4 w-4" /> Nueva tarea
                  </button>
                )}
                <button onClick={() => setShowFilters(!showFilters)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors md:hidden">
                  Filtros
                </button>
                {hasActiveViewFilters && (
                  <button onClick={clearViewFilters} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50">
                    Limpiar
                  </button>
                )}
                {appCanCreate && (
                  <button aria-label={deleteMode ? "Salir de eliminar tareas" : "Eliminar tareas"} title={deleteMode ? "Salir de eliminar tareas" : "Eliminar tareas"} onClick={() => setDeleteMode(!deleteMode)} className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${deleteMode ? "border-red-500 bg-red-500 text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}><Trash2 className="h-4 w-4" /></button>
                )}
                <span className="hidden text-xs font-bold text-slate-400 md:inline">{displayedTasks.length} tareas</span>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {opsCards.map(({ key, label, value, icon: Icon, tone }) => (
                <button
                  key={key}
                  onClick={() => setOpsFilter(opsFilter === key ? "all" : key)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-all ${opsFilter === key ? `${tone} ring-2 ring-cyan-200` : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200"}`}
                >
                  <span className="flex items-center gap-2 text-xs font-black uppercase">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  <span className="text-lg font-black">{value}</span>
                </button>
              ))}
            </div>

            <div className={`${showFilters ? "grid" : "hidden"} grid-cols-2 gap-2 md:grid md:grid-cols-[repeat(8,minmax(0,auto))] md:items-center`}>
              <select value={mod} onChange={e => setMod(e.target.value)} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none">
                <option value="Todos">Módulos</option>{modules.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={prio} onChange={e => setPrio(e.target.value)} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none">
                <option value="Todas">Prioridades</option><option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option>
              </select>
              <select value={phase} onChange={e => setPhase(e.target.value)} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none">
                {phasesOptions.map(p => <option key={p} value={p}>{p === "Todas" ? "Fases" : `${p} - ${phaseMap[p]}`}</option>)}
              </select>
              {isLocalDemo && (
                <>
                  <select value={systemFilter} onChange={e => setSystemFilter(e.target.value)} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none">
                    <option value="Todos">Sistemas</option>{itConfig.systems.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none">
                    <option value="Todos">Tipos</option>{itConfig.ticketTypes.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <select value={slaFilter} onChange={e => setSlaFilter(e.target.value)} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none">
                    <option value="Todos">SLA</option><option value="Con SLA">Con SLA</option><option value="Sin SLA">Sin SLA</option><option value="Vencidas">Vencidas</option>
                  </select>
                  <select value={responsibleFilter} onChange={e => setResponsibleFilter(e.target.value)} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none">
                    <option value="Todos">Responsable</option>{itConfig.team.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </>
              )}
            </div>
          </div>

          {viewMode === "list" ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="grid min-w-[1040px] grid-cols-[1fr_150px_130px_120px_120px_120px_120px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-400">
                <span>Tarea</span>
                <span>Responsable</span>
                <span>Sistema</span>
                <span>SLA</span>
                <span>Vence</span>
                <span>Estado</span>
                <span>Prioridad</span>
              </div>
              <div className="divide-y divide-slate-100">
                {displayedTasks.map(task => {
                  const S = statusMeta[task.status]?.icon || Circle;
                  const P = priorityMeta[task.priority]?.icon || Flag;
                  const op = operationalStates[getOperationalState(task)] || operationalStates.normal;
                  const Op = op.icon;
                  return (
                    <button key={task.id} onClick={() => setDetailT(task)} className="grid min-w-[1040px] w-full grid-cols-[1fr_150px_130px_120px_120px_120px_120px] gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50">
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-slate-900">{task.title}</span>
                        <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-400"><Op className="h-3.5 w-3.5" />{op.label}</span>
                      </span>
                      <span className="truncate font-semibold text-slate-600">{task.assignedName || "Sin asignar"}</span>
                      <span className="truncate text-slate-600">{task.system || "Sin sistema"}</span>
                      <span className="font-semibold text-slate-600">{task.slaHours ? `${task.slaHours}h` : "Sin SLA"}</span>
                      <span className={`font-semibold ${isTaskOverdue(task) ? "text-red-600" : "text-slate-500"}`}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Sin fecha"}</span>
                      <span className="flex items-center gap-1.5 font-semibold text-slate-600"><S className="h-4 w-4" />{task.status}</span>
                      <span className="flex items-center gap-1.5 font-semibold text-slate-600"><P className="h-4 w-4" />{task.priority}</span>
                    </button>
                  );
                })}
                {displayedTasks.length === 0 && (
                  <div className="px-4 py-10 text-center text-sm font-semibold text-slate-400">No hay tareas con estos filtros.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2">
              {columns.map(({ status, items }) => (
                <Column key={status} status={status} items={items} collapsed={collapsed} toggleCollapse={toggleCollapse} isAdmin={appIsAdmin} deleteMode={deleteMode} onSelect={setDetailT} onDelete={deleteTask} userMap={userMap} onAdd={openAddTask} onTaskPatch={patchTask} isLocal={isLocalDemo} users={users} deletingId={deletingId} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)}>
        <TaskForm onSave={addTask} onClose={() => setShowAdd(false)} users={users} itConfig={itConfig} isLocal={isLocalDemo} />
      </Modal>

      <Modal open={!!editT} onClose={() => setEditT(null)}>
        {editT && <TaskForm onSave={editTask} onClose={() => setEditT(null)} initial={editT} users={users} itConfig={itConfig} isLocal={isLocalDemo} />}
      </Modal>

      <Modal open={!!detailT} onClose={() => setDetailT(null)} wide>
        <ErrorBoundary key={detailT?.id}>
          {detailT && <TaskDetail task={detailT} onDelete={deleteTask} onClose={() => setDetailT(null)} onStatus={updateStatus} onArchive={archiveTask} isAdmin={appIsAdmin} activeBoardId={isLocalDemo ? null : activeBoardId} users={users} onTaskPatch={patchTask} itConfig={itConfig} isLocal={isLocalDemo} deletingId={deletingId} />}
        </ErrorBoundary>
      </Modal>

      <Modal open={showItConfig} onClose={() => setShowItConfig(false)}>
        <ITConfigPanel config={itConfig} onSave={setItConfig} onReset={resetLocalDemo} onClose={() => setShowItConfig(false)} />
      </Modal>

      <Modal open={showAdmin} onClose={() => setShowAdmin(false)}>
        <AdminPanel users={users} currentUser={appUser} onClose={() => setShowAdmin(false)} itConfig={itConfig} />
      </Modal>

      <DragOverlay>
        {activeTask && (
          <div className="rounded-xl border bg-white p-2.5 md:p-3 shadow-xl rotate-2 scale-105 ring-2 ring-slate-400">
            <CardContent task={activeTask} />
          </div>
        )}
      </DragOverlay>
    </DndContext>

    <button
      onClick={() => setSidebarOpen(!sidebarOpen)}
      className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 items-center justify-center h-20 w-6 rounded-l-lg border border-r-0 border-slate-300 bg-white shadow-md text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
    >
      {sidebarOpen ? "▶" : "◀"}
    </button>
    <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onQuickAction={handleSidebarAction} users={users} />
    <ToastNotification message={toast} onClose={() => setToast(null)} />
    </>
  );
}

function ToastNotification({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] max-w-sm animate-in slide-in-from-right-4 fade-in duration-300 rounded-xl border border-red-200 bg-white px-4 py-3 shadow-xl">
      <div className="flex items-start gap-3">
        <span className="text-sm text-red-600 font-semibold leading-snug">{message}</span>
        <button onClick={onClose} className="shrink-0 text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
