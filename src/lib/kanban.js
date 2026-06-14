import { pointerWithin, rectIntersection, closestCenter } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";

export function kanbanCollisionDetection(args) {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) return pointerHits;
  const rectHits = rectIntersection(args);
  if (rectHits.length > 0) return rectHits;
  return closestCenter(args);
}

export function useKanbanSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

export function filterTasks(tasks, q, mod, prio, ph) {
  const cq = q.trim().toLowerCase();
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
