export const CHECKLIST_TEMPLATE = {
  scope: { id: "scope", text: "Validar alcance", done: false },
  execute: { id: "execute", text: "Ejecutar trabajo técnico", done: false },
  verify: { id: "verify", text: "Verificar y cerrar", done: false },
};

export function makeChecklist(title) {
  return [
    { ...CHECKLIST_TEMPLATE.scope },
    {
      ...CHECKLIST_TEMPLATE.execute,
      text: title?.toLowerCase().includes("research")
        ? "Documentar hallazgos"
        : "Ejecutar trabajo técnico",
    },
    { ...CHECKLIST_TEMPLATE.verify },
  ];
}

export function checklistProgress(task) {
  const items = Array.isArray(task?.checklist) ? task.checklist : [];
  if (!items.length) return { done: 0, total: 0, pct: 0 };
  const done = items.filter((i) => i.done).length;
  return { done, total: items.length, pct: Math.round((done / items.length) * 100) };
}

export function isChecklistComplete(task) {
  const { done, total } = checklistProgress(task);
  return total > 0 && done === total;
}
