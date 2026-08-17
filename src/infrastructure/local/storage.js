import { localTasksKey } from "../../core/domain/constants/storage";

export function readLocalJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeLocalJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    if (import.meta.env.DEV) console.warn("localStorage write failed:", key, e);
  }
}

export { localTasksKey };
