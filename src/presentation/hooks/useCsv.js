import { APP_NAME } from "../../branding";
import { phaseMap, operationalStates } from "../../constants/meta";
import { csvCell, checklistProgress, getOperationalState } from "../../lib/utils";

/**
 * useCsv — exportación CSV de tareas y reporte imprimible.
 * useCsv — task CSV export and printable report.
 */
export function useCsv({ tasks, displayedTasks }) {
  function exportCSV(
    sourceTasks = tasks.filter((t) => !t.archived),
    filename = "kanban-it-tasks.csv",
  ) {
    const headers =
      [
        "Título",
        "Sistema",
        "Tipo",
        "Impacto",
        "Urgencia",
        "SLA horas",
        "Vencimiento",
        "Módulo",
        "Fase",
        "Prioridad",
        "Esfuerzo",
        "Estado",
        "Decisión manager",
        "Asignado",
        "Solicitante",
        "Checklist",
      ]
        .map(csvCell)
        .join(",") + "\n";
    const rows = sourceTasks
      .map((t) => {
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
        ]
          .map(csvCell)
          .join(",");
      })
      .join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function exportVisibleCSV() {
    exportCSV(displayedTasks, "kanban-it-report-visible.csv");
  }

  function printReport() {
    const previousTitle = document.title;
    document.title = `${APP_NAME} - Reporte`;
    window.print();
    window.setTimeout(() => {
      document.title = previousTitle;
    }, 250);
  }

  return { exportCSV, exportVisibleCSV, printReport };
}
