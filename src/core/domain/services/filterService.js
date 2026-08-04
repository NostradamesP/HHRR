import { cleanValue } from "./formatService";

export function filterTasks(tasks, q, mod, prio, ph) {
  const cq = cleanValue(q).toLowerCase();
  return tasks.filter((t) => {
    const st = [
      t.title,
      t.module,
      t.phase,
      t.priority,
      t.description,
      t.system,
      t.ticketType,
      t.requester,
      t.impact,
      t.urgency,
    ]
      .join(" ")
      .toLowerCase();
    return (
      (cq === "" || st.includes(cq)) &&
      (mod === "Todos" || t.module === mod) &&
      (prio === "Todas" || t.priority === prio) &&
      (ph === "Todas" || t.phase === ph)
    );
  });
}

export function groupCounts(tasks, getter, fallback = "Sin definir") {
  const counts = new Map();
  tasks.forEach((task) => {
    const key = cleanValue(getter(task)) || fallback;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

export function uniqueOptions(values) {
  const seen = new Set();
  return values
    .map(cleanValue)
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
