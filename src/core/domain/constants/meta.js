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

export const phases = Object.keys(phaseMap);

export const effortWeight = { Alto: 3, Medio: 2, Bajo: 1 };

export const operationalStates = {
  normal: "Normal",
  follow_up: "Necesita seguimiento",
  blocked: "Bloqueada",
  ready_to_close: "Lista para cerrar",
};

export const DEFAULT_LOCAL_ASSIGNED = "local-demo-user";
export const DEFAULT_LOCAL_ASSIGNED_NAME = "IT Manager";
export const DEFAULT_LOCAL_REQUESTER = "Operaciones IT";
export const DEMO_DISPLAY_NAME = "Demo NoraHR";
