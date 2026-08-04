import { useEffect, useRef, useState } from "react";
import { initialTasks } from "../../constants/tasks";
import { LOCAL_TASKS_KEY, localTasksKey } from "../../constants/storage";
import { readLocalJSON, writeLocalJSON, enrichLocalTask } from "../../lib/utils";

/**
 * useBoardData — estado de tareas, suscripción Firestore/local y persistencia local.
 * useBoardData — task state, Firestore/local subscription and local persistence.
 */
export function useBoardData({
  isLocalDemo,
  user,
  activeBoardId,
  itConfig,
  showToast,
  taskService,
  appActor,
  setDetailT,
  setActiveId,
}) {
  const [tasks, setTasks] = useState([]);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const localLoaded = useRef(false);
  const skipNextLocalWrite = useRef(false);

  useEffect(() => {
    if (isLocalDemo) {
      localLoaded.current = false;
      const localBoardId = activeBoardId || "local-demo-board";
      const saved = readLocalJSON(localTasksKey(localBoardId), null);
      const legacySaved =
        localBoardId === "local-demo-board" ? readLocalJSON(LOCAL_TASKS_KEY, null) : null;
      const source = Array.isArray(saved) ? saved : legacySaved;
      const localTasks =
        Array.isArray(source) && source.length
          ? source.map((t, idx) => enrichLocalTask(t, idx, itConfig))
          : localBoardId === "local-demo-board"
            ? initialTasks.map((t, idx) => enrichLocalTask(t, idx, itConfig))
            : [];
      skipNextLocalWrite.current = true;
      setTasks(localTasks);
      setDetailT(null);
      setActiveId(null);
      localLoaded.current = true;
      return;
    }
    if (!user || !activeBoardId) {
      setTasks([]);
      tasksRef.current = [];
      setDetailT(null);
      setActiveId(null);
      return;
    }
    setTasks([]);
    tasksRef.current = [];
    setDetailT(null);
    setActiveId(null);
    const unsub = taskService.subscribeTasks(
      activeBoardId,
      (ts) => {
        setTasks(ts);
        tasksRef.current = ts;
        setDetailT((prev) => {
          if (!prev) return prev;
          const updated = ts.find((t) => t.id === prev.id);
          return updated || null;
        });
        const missingOrder = ts.filter((t) => t.order === undefined || t.order === null);
        if (missingOrder.length > 0) {
          Promise.allSettled(
            missingOrder.map((t) =>
              taskService.updateTask(activeBoardId, t.id, { order: Date.now() }, appActor),
            ),
          );
        }
      },
      (err) => {
        if (import.meta.env.DEV) console.error("Tasks listener error:", err);
        showToast("No se pudieron cargar las tareas del board.");
      },
    );
    return unsub;
  }, [user, activeBoardId, isLocalDemo, showToast, itConfig, taskService, appActor, setDetailT, setActiveId]);

  useEffect(() => {
    if (!isLocalDemo || !localLoaded.current) return;
    if (skipNextLocalWrite.current) {
      skipNextLocalWrite.current = false;
      return;
    }
    writeLocalJSON(localTasksKey(activeBoardId || "local-demo-board"), tasks);
  }, [tasks, isLocalDemo, activeBoardId]);

  return { tasks, setTasks, tasksRef };
}
