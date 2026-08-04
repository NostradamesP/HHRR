/**
 * Modelo de permisos por rol/puesto. Alineado con firestore.rules (isManager / isBoardOperator).
 * Role/job-title permission model. Mirrors firestore.rules (isManager / isBoardOperator).
 */

export const MANAGER_JOB_TITLES = ["IT Project Manager", "IT Manager", "Manager"];

export const JOB_TITLE_HIERARCHY = {
  "IT Project Manager": "manager",
  "System Administrator": "admin",
  Ciberseguridad: "admin",
  "DevOps Engineer": "editor",
  "Network Engineer": "editor",
  "Database Administrator": "editor",
  "Cloud Architect": "editor",
  "Soporte Técnico": "viewer",
  "Help Desk Analyst": "viewer",
  "IT Auditor": "viewer",
};

/** Claves que un miembro no operador puede actualizar de una tarea (igual que firestore.rules). */
export const MEMBER_EDITABLE_TASK_KEYS = ["status", "operationalState", "order", "commentsCount"];

/** @param {string|undefined} role @returns {boolean} */
export function isRoleManager(role) {
  return role === "admin" || role === "manager";
}

/** @param {string|undefined} jobTitle @returns {boolean} */
export function isJobTitleManager(jobTitle) {
  return MANAGER_JOB_TITLES.includes(jobTitle);
}

/** @param {{ role?: string, jobTitle?: string }} actor @returns {boolean} */
export function isManager(actor) {
  return isRoleManager(actor?.role) || isJobTitleManager(actor?.jobTitle);
}

/** @param {{ jobTitle?: string }} actor @returns {string} */
export function effectiveLevel(actor) {
  return JOB_TITLE_HIERARCHY[actor?.jobTitle || ""] || "viewer";
}

/** @param {{ role?: string, jobTitle?: string }} actor @returns {boolean} */
export function canCreate(actor) {
  return isManager(actor) || ["admin", "manager"].includes(effectiveLevel(actor));
}

/** @param {{ role?: string, jobTitle?: string }} actor @returns {boolean} */
export function canFullEdit(actor) {
  return canCreate(actor) || effectiveLevel(actor) === "editor";
}
