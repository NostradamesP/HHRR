export const DEFAULT_ROLE = "member";
export const DEFAULT_JOB_TITLE = "Soporte Técnico";

export function createUser(input = {}) {
  return {
    uid: input.uid ?? "",
    email: input.email ?? "",
    name: input.name ?? "",
    role: input.role ?? DEFAULT_ROLE,
    jobTitle: input.jobTitle ?? DEFAULT_JOB_TITLE,
    createdAt: input.createdAt ?? null,
    ...input,
  };
}

export function isAdmin(userData) {
  return userData?.role === "admin";
}

export function isManager(userData) {
  return userData?.role === "manager" || userData?.role === "admin";
}
