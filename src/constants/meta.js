import { Circle, Clock3, Lock, CheckCircle2, Flame, Flag, Loader2 } from "lucide-react";

export const statuses = ["Pendiente", "En progreso", "Bloqueado", "Hecho"];

export const phaseMap = {
  V1: "Fundación",
  V2: "Auth y empresas",
  V3: "RRHH Self-Service",
  V4: "Documentos",
  V5: "Dashboard Admin",
  V6: "Payroll Lite",
  V7: "Cumplimiento RD",
  V8: "BI + IA",
};

export const phaseColors = {
  V1: "bg-blue-100 text-blue-700 border-blue-200",
  V2: "bg-cyan-100 text-cyan-700 border-cyan-200",
  V3: "bg-green-100 text-green-700 border-green-200",
  V4: "bg-amber-100 text-amber-700 border-amber-200",
  V5: "bg-rose-100 text-rose-700 border-rose-200",
  V6: "bg-cyan-100 text-cyan-700 border-cyan-200",
  V7: "bg-orange-100 text-orange-700 border-orange-200",
  V8: "bg-blue-100 text-blue-700 border-blue-200",
};

export const modColors = {
  Producto: "bg-sky-100 text-sky-700",
  Arquitectura: "bg-cyan-100 text-cyan-700",
  Seguridad: "bg-red-100 text-red-700",
  Infraestructura: "bg-slate-100 text-slate-700",
  Diseño: "bg-pink-100 text-pink-700",
  Auth: "bg-blue-100 text-blue-700",
  Empresas: "bg-teal-100 text-teal-700",
  Auditoría: "bg-yellow-100 text-yellow-700",
  Empleados: "bg-green-100 text-green-700",
  Flutter: "bg-cyan-100 text-cyan-700",
  Solicitudes: "bg-orange-100 text-orange-700",
  Documentos: "bg-amber-100 text-amber-700",
  Reportes: "bg-rose-100 text-rose-700",
  Notificaciones: "bg-sky-100 text-sky-700",
  Nómina: "bg-emerald-100 text-emerald-700",
  "Compliance RD": "bg-red-100 text-red-700",
  BI: "bg-blue-100 text-blue-700",
  IA: "bg-cyan-100 text-cyan-700",
};

export const modules = Object.keys(modColors);

export const effortWeight = { Alto: 3, Medio: 2, Bajo: 1 };

export const priorityMeta = {
  Alta: { label: "Alta", icon: Flame, tone: "text-red-600 bg-red-50 border-red-100" },
  Media: { label: "Media", icon: Flag, tone: "text-amber-600 bg-amber-50 border-amber-100" },
  Baja: { label: "Baja", icon: Circle, tone: "text-slate-500 bg-slate-50 border-slate-100" },
};

export const statusMeta = {
  Pendiente: {
    icon: Circle,
    tone: "text-slate-600",
    soft: "bg-slate-100 text-slate-700 border-slate-200",
    accent: "bg-slate-400",
  },
  "En progreso": {
    icon: Loader2,
    tone: "text-blue-600",
    soft: "bg-blue-50 text-blue-700 border-blue-100",
    accent: "bg-blue-500",
  },
  Bloqueado: {
    icon: Lock,
    tone: "text-rose-600",
    soft: "bg-rose-50 text-rose-700 border-rose-100",
    accent: "bg-rose-500",
  },
  Hecho: {
    icon: CheckCircle2,
    tone: "text-emerald-600",
    soft: "bg-emerald-50 text-emerald-700 border-emerald-100",
    accent: "bg-emerald-500",
  },
};

export const operationalStates = {
  normal: { label: "Normal", tone: "border-slate-200 bg-slate-50 text-slate-600", icon: Circle },
  follow_up: {
    label: "Necesita seguimiento",
    tone: "border-amber-100 bg-amber-50 text-amber-700",
    icon: Clock3,
  },
  blocked: { label: "Bloqueada", tone: "border-rose-100 bg-rose-50 text-rose-700", icon: Lock },
  ready_to_close: {
    label: "Lista para cerrar",
    tone: "border-emerald-100 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },
};
