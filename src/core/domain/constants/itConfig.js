import { JOB_TITLE_HIERARCHY } from "./roles";

export const defaultItConfig = {
  systems: ["Network", "Microsoft 365", "Active Directory", "Firewall", "Endpoints", "ERP"],
  ticketTypes: ["Incidente", "Cambio", "Mantenimiento", "Acceso", "Proyecto"],
  impacts: ["Bajo", "Medio", "Alto", "Crítico"],
  urgencies: ["Baja", "Media", "Alta", "Crítica"],
  team: ["IT Manager", "Soporte Nivel 1", "Infraestructura", "Mesa de ayuda"],
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
  jobTitleHierarchy: JOB_TITLE_HIERARCHY,
};
