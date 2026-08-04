import { LOCAL_LOGS_KEY } from "../../constants/storage";
import { makeChecklist, readLocalJSON, writeLocalJSON } from "../../lib/utils";

/**
 * useTaskActions — acciones CRUD sobre tareas (crear/editar/estado/eliminar/archivar/patch) con logs.
 * useTaskActions — task CRUD actions (create/edit/status/delete/archive/patch) with audit logs.
 */
export function useTaskActions({
  isLocalDemo,
  user,
  userData,
  activeBoardId,
  taskService,
  auditService,
  appActor,
  appUser,
  appUserData,
  newTaskStatus,
  setNewTaskStatus,
  setShowAdd,
  setEditT,
  showToast,
  tasksRef,
  setTasks,
  setDeletingId,
  detailT,
  setDetailT,
}) {
  async function createLog(taskId, taskTitle, action, details) {
    if (isLocalDemo) return;
    if (!user || !activeBoardId) return;
    try {
      await auditService.log({
        boardId: activeBoardId,
        action,
        taskId,
        taskTitle,
        details: details || "",
        actor: user.uid,
        actorName: userData?.name || user.email,
      });
    } catch (e) {
      if (import.meta.env.DEV) console.error("Error creating log:", e);
    }
  }

  function createLocalLog(taskId, taskTitle, action, details) {
    const all = readLocalJSON(LOCAL_LOGS_KEY, {});
    const log = {
      id: `local-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      taskId,
      taskTitle,
      details: details || "",
      userName: appUserData?.name || "IT Manager",
      createdAt: new Date().toISOString(),
    };
    all[taskId] = [...(all[taskId] || []), log];
    writeLocalJSON(LOCAL_LOGS_KEY, all);
  }

  async function archiveTask(id, archived) {
    setDeletingId(id);
    const currentTasks = tasksRef.current;
    const task = currentTasks.find((t) => t.id === id);
    if (!task) return setDeletingId(null);
    if (isLocalDemo) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, archived } : t)));
      createLocalLog(id, task.title, archived ? "archived" : "restored", "");
      setDeletingId(null);
      return;
    }
    try {
      await taskService.updateTask(activeBoardId, id, { archived }, appActor);
      createLog(id, task.title, archived ? "archived" : "restored", "");
    } catch (e) {
      if (import.meta.env.DEV) console.error("Error archiving task:", e);
      showToast("Error al archivar la tarea");
    }
    setDeletingId(null);
  }

  async function updateStatus(id, s) {
    const currentTasks = tasksRef.current;
    const task = currentTasks.find((t) => t.id === id);
    if (!task) return;
    const opPatch =
      s === "Bloqueado" ? { operationalState: "blocked" } : { operationalState: "normal" };
    const previousDetail = detailT;
    setDetailT((prev) =>
      prev && prev.id === id ? { ...prev, status: s, ...opPatch, order: Date.now() } : prev,
    );
    if (isLocalDemo) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: s, ...opPatch, order: Date.now() } : t)),
      );
      createLocalLog(id, task.title, "status_changed", `${task.status} → ${s}`);
      return;
    }
    try {
      await taskService.updateTask(
        activeBoardId,
        id,
        {
          status: s,
          ...opPatch,
          order: Date.now(),
        },
        appActor,
      );
      createLog(id, task.title, "status_changed", `${task.status} → ${s}`);
    } catch (e) {
      if (import.meta.env.DEV) console.error("Error updating status:", e);
      setDetailT(previousDetail);
    }
  }

  async function deleteTask(id) {
    setDeletingId(id);
    const currentTasks = tasksRef.current;
    const task = currentTasks.find((t) => t.id === id);
    if (!task && !isLocalDemo) return;
    if (isLocalDemo) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (task) createLocalLog(id, task.title, "deleted", "");
      setDeletingId(null);
      return;
    }
    try {
      await taskService.deleteTask(activeBoardId, id);
      if (task) createLog(id, task.title, "deleted", "");
    } catch (e) {
      if (import.meta.env.DEV) console.error("Error deleting task:", e);
      showToast("Error al eliminar la tarea");
    }
    setDeletingId(null);
  }

  async function addTask(f) {
    const defaultAssigneeId = appUser?.uid || "";
    const defaultAssigneeName = appUserData?.name || appUser?.email || "";
    if (isLocalDemo) {
      const newId = `local-${Date.now()}`;
      setTasks((prev) => [
        {
          title: f.title,
          module: f.module,
          phase: f.phase,
          priority: f.priority,
          effort: f.effort,
          description: f.description || "",
          status: newTaskStatus,
          order: Date.now(),
          startDate: f.startDate || "",
          dueDate: f.dueDate || "",
          archived: false,
          assignedTo: f.assignedTo || defaultAssigneeId,
          assignedName: f.assignedName || defaultAssigneeName,
          ticketType: f.ticketType || "",
          requester: f.requester || "",
          system: f.system || "",
          impact: f.impact || "",
          urgency: f.urgency || "",
          slaHours: f.slaHours || "",
          checklist: f.checklist || makeChecklist(f.title),
          commentsCount: 0,
          operationalState: f.operationalState || "normal",
          blockedReason: f.blockedReason || "",
          id: newId,
        },
        ...prev,
      ]);
      createLocalLog(newId, f.title, "created", "");
      setShowAdd(false);
      setNewTaskStatus("Pendiente");
      return;
    }
    if (!activeBoardId) {
      throw new Error("No hay un board activo para crear la tarea.");
    }
    try {
      const ref = await taskService.createTask(activeBoardId, {
        title: f.title,
        module: f.module,
        phase: f.phase,
        priority: f.priority,
        effort: f.effort,
        description: f.description || "",
        status: newTaskStatus,
        order: Date.now(),
        startDate: f.startDate || "",
        dueDate: f.dueDate || "",
        archived: false,
        assignedTo: f.assignedTo || defaultAssigneeId,
        assignedName: f.assignedName || defaultAssigneeName,
        ticketType: f.ticketType || "",
        requester: f.requester || "",
        system: f.system || "",
        impact: f.impact || "",
        urgency: f.urgency || "",
        slaHours: f.slaHours || "",
        checklist: f.checklist || makeChecklist(f.title),
        commentsCount: 0,
        operationalState: f.operationalState || "normal",
        blockedReason: f.blockedReason || "",
        attachments: [],
        createdBy: user.uid,
      });
      createLog(ref.id, f.title, "created", "");
      setShowAdd(false);
      setNewTaskStatus("Pendiente");
    } catch (e) {
      if (import.meta.env.DEV) console.error("Error adding task:", e);
      showToast("Error al crear la tarea");
      throw new Error(e?.message || "Firebase rechazó la creación de la tarea.");
    }
  }

  async function editTask(f) {
    if (isLocalDemo) {
      const { id, ...data } = f;
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
      const currentTasks = tasksRef.current;
      const task = currentTasks.find((t) => t.id === id);
      createLocalLog(id, (task || f).title, "updated", "");
      setEditT(null);
      return;
    }
    if (!activeBoardId) {
      throw new Error("No hay un board activo para editar la tarea.");
    }
    try {
      const { id, ...data } = f;
      await taskService.updateTask(activeBoardId, id, data, appActor);
      createLog(id, f.title, "updated", "");
      setEditT(null);
    } catch (e) {
      if (import.meta.env.DEV) console.error("Error editing task:", e);
      showToast("Error al editar la tarea");
      throw new Error(e?.message || "Firebase rechazó la edición de la tarea.");
    }
  }

  async function patchTask(id, patch) {
    const previousDetail = detailT;
    setDetailT((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
    if (isLocalDemo) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      const currentTasks = tasksRef.current;
      const task = currentTasks.find((t) => t.id === id);
      const logTitle = patch.title || task?.title || "Tarea";
      createLocalLog(id, logTitle, "updated", `Campo: ${Object.keys(patch).join(", ")}`);
      return;
    }
    const currentTasks = tasksRef.current;
    const task = currentTasks.find((t) => t.id === id);
    try {
      await taskService.updateTask(activeBoardId, id, patch, appActor);
      if (task)
        createLog(id, task.title, "updated", `Campo actualizado: ${Object.keys(patch).join(", ")}`);
    } catch (e) {
      if (import.meta.env.DEV) console.error("Error patching task:", e);
      setDetailT(previousDetail);
      showToast("Error al guardar los cambios");
    }
  }

  return {
    createLog,
    createLocalLog,
    archiveTask,
    updateStatus,
    deleteTask,
    addTask,
    editTask,
    patchTask,
  };
}
