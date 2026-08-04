import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  Archive,
  BarChart3,
  Calendar,
  CheckCircle2,
  Circle,
  Download,
  Flag,
  Flame,
  LayoutDashboard,
  ListFilter,
  Lock,
  MoreVertical,
  Plus,
  Search,
  SearchX,
  Settings,
  SlidersHorizontal,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { useBoard } from "./BoardContext";
import { useServices } from "./presentation/context/ServicesContext";
import Sidebar from "./Sidebar";
import { APP_MONOGRAM, APP_NAME, displayBoardName } from "./branding";

// Constants
import { initialTasks } from "./constants/tasks";
import {
  statuses,
  phaseMap,
  modules,
  effortWeight,
  priorityMeta,
  statusMeta,
  operationalStates,
} from "./constants/meta";
import { defaultItConfig } from "./constants/defaultItConfig";
import {
  LOCAL_TASKS_KEY,
  LOCAL_COMMENTS_KEY,
  LOCAL_IT_CONFIG_KEY,
  LOCAL_LOGS_KEY,
  localTasksKey,
} from "./constants/storage";

// Utils
import {
  readLocalJSON,
  writeLocalJSON,
  makeChecklist,
  enrichLocalTask,
  checklistProgress,
  isTaskOverdue,
  getOperationalState,
  isReadyToClose,
  operationalRank,
  csvCell,
  cleanValue,
  displayPersonName,
  uniqueOptions,
} from "./lib/utils";
import { kanbanCollisionDetection, filterTasks } from "./lib/kanban";

// UI Components
import ErrorBoundary from "./components/ui/ErrorBoundary";
import Avatar from "./components/ui/Avatar";
import Modal from "./components/ui/Modal";
import LoadingScreen from "./components/ui/LoadingScreen";
import ToastNotification from "./components/ui/ToastNotification";

// Kanban Components
import Column from "./components/kanban/Column";
import CardContent from "./components/kanban/CardContent";

// View Components
import GanttView from "./components/views/GanttView";
import ReportsView from "./components/views/ReportsView";
import TaskForm from "./components/views/TaskForm";
import TaskDetail from "./components/views/TaskDetail";

// Config Components
import ITConfigPanel from "./components/config/ITConfigPanel";
import AdminPanel from "./components/config/AdminPanel";

// Landing Components
import LandingPage from "./components/landing/LandingPage";
import LoginModal from "./components/landing/LoginModal";

const LOADING_STEPS = [
  { message: "Conectando tu tablero", subtitle: "Verificando tus permisos..." },
  { message: "Cargando tareas", subtitle: "Sincronizando con tu espacio de trabajo..." },
  { message: "Todo listo", subtitle: "Bienvenido a Kanban IT Department" },
];

export default function NoraHRKanban() {
  const { user, userData, loading, logout, isAdmin } = useAuth();
  const { activeBoardId, boards } = useBoard();
  const { taskService, auditService, userService } = useServices();
  const isLocalDemo = !user && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const appUser =
    user || (isLocalDemo ? { uid: "local-demo-user", email: "demo@norahr.local" } : null);
  const appUserData =
    userData ||
    (isLocalDemo ? { name: "IT Manager", role: "admin", email: "demo@norahr.local" } : null);
  const appRole = appUserData?.role || "member";
  const appIsAdmin = isAdmin || isLocalDemo;
  const appActiveBoardId = activeBoardId || (isLocalDemo ? "local-demo-board" : null);
  const appBoards = useMemo(
    () =>
      boards.length > 0
        ? boards
        : isLocalDemo
          ? [{ id: "local-demo-board", name: APP_NAME }]
          : boards,
    [boards, isLocalDemo],
  );
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mod, setMod] = useState("Todos");
  const [prio, setPrio] = useState("Todas");
  const [phase, setPhase] = useState("Todas");
  const [systemFilter, setSystemFilter] = useState("Todos");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [slaFilter, setSlaFilter] = useState("Todos");
  const [responsibleFilter, setResponsibleFilter] = useState("Todos");
  const [opsFilter, setOpsFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState("Pendiente");
  const [editT, setEditT] = useState(null);
  const [detailT, setDetailT] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [showAdmin, setShowAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [viewMode, setViewMode] = useState("board");
  const [myWorkOnly, setMyWorkOnly] = useState(false);
  const [commentsOnly, setCommentsOnly] = useState(false);
  const [showItConfig, setShowItConfig] = useState(false);
  const [itConfig, setItConfig] = useState(() =>
    readLocalJSON(LOCAL_IT_CONFIG_KEY, defaultItConfig),
  );
  const [activeId, setActiveId] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = "error") => setToast({ message: msg, type }), []);
  const [deletingId, setDeletingId] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (!showLoadingScreen) return;
    setLoadingStep(0);
    const timers = LOADING_STEPS.map((_, i) =>
      setTimeout(() => setLoadingStep(i + 1), (i + 1) * 600),
    );
    const done = setTimeout(() => setShowLoadingScreen(false), (LOADING_STEPS.length + 1) * 600);
    return () => {
      timers.forEach((t) => clearTimeout(t));
      clearTimeout(done);
    };
  }, [showLoadingScreen]);

  function handleLoginSuccess() {
    setShowLoginModal(false);
    setShowLoadingScreen(true);
  }

  const appUserLevel = isLocalDemo
    ? "manager"
    : (itConfig.jobTitleHierarchy || {})[appUserData?.jobTitle || ""] || "viewer";
  const appCanCreate =
    appIsAdmin || appRole === "manager" || appUserLevel === "manager" || appUserLevel === "admin";
  const appCanEdit = appCanCreate || appUserLevel === "editor";
  const appActor = useMemo(
    () => ({
      uid: appUser?.uid || null,
      role: appUserData?.role,
      jobTitle: appUserData?.jobTitle,
    }),
    [appUser?.uid, appUserData?.role, appUserData?.jobTitle],
  );
  const activeTask = useMemo(() => tasks.find((t) => t.id === activeId), [activeId, tasks]);
  const boardsRef = useRef(appBoards);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const localLoaded = useRef(false);
  const skipNextLocalWrite = useRef(false);
  boardsRef.current = appBoards;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
  }, [user, activeBoardId, isLocalDemo, showToast, itConfig, taskService, appActor]);

  useEffect(() => {
    if (!isLocalDemo || !localLoaded.current) return;
    if (skipNextLocalWrite.current) {
      skipNextLocalWrite.current = false;
      return;
    }
    writeLocalJSON(localTasksKey(activeBoardId || "local-demo-board"), tasks);
  }, [tasks, isLocalDemo, activeBoardId]);

  useEffect(() => {
    if (!isLocalDemo) return;
    writeLocalJSON(LOCAL_IT_CONFIG_KEY, itConfig);
  }, [itConfig, isLocalDemo]);

  useEffect(() => {
    if (isLocalDemo) {
      setUsers([]);
      return;
    }
    if (!user) {
      setUsers([]);
      return;
    }
    if (!appIsAdmin) {
      setUsers(userData ? [{ id: user.uid, ...userData }] : []);
      return;
    }
    return userService.subscribeUsers(
      (next) => setUsers(next),
      (err) => {
        if (import.meta.env.DEV) console.error("Users listener error:", err);
      },
    );
  }, [user, userData, appIsAdmin, isLocalDemo, userService]);

  const localCommentTaskIds = useMemo(() => {
    if (!isLocalDemo) return new Set();
    const all = readLocalJSON(LOCAL_COMMENTS_KEY, {});
    return new Set(
      Object.entries(all)
        .filter(([, comments]) => Array.isArray(comments) && comments.length > 0)
        .map(([taskId]) => taskId),
    );
  }, [isLocalDemo]);

  const displayedTasks = useMemo(() => {
    let ts = tasks.filter((t) => (showArchived ? t.archived : !t.archived));
    if (myWorkOnly) {
      ts = ts.filter((t) => t.assignedTo === appUser?.uid || t.assignedName === appUserData?.name);
    }
    if (commentsOnly) {
      ts = ts.filter(
        (t) => Number(t.commentsCount || 0) > 0 || localCommentTaskIds.has(String(t.id)),
      );
    }
    if (systemFilter !== "Todos") ts = ts.filter((t) => t.system === systemFilter);
    if (typeFilter !== "Todos") ts = ts.filter((t) => t.ticketType === typeFilter);
    if (responsibleFilter !== "Todos") ts = ts.filter((t) => t.assignedName === responsibleFilter);
    if (slaFilter === "Con SLA") ts = ts.filter((t) => t.slaHours);
    if (slaFilter === "Sin SLA") ts = ts.filter((t) => !t.slaHours);
    if (slaFilter === "Vencidas") {
      ts = ts.filter(isTaskOverdue);
    }
    if (overdueOnly) {
      ts = ts.filter(isTaskOverdue);
    }
    if (opsFilter === "overdue") ts = ts.filter(isTaskOverdue);
    if (opsFilter === "blocked") ts = ts.filter((t) => getOperationalState(t) === "blocked");
    if (opsFilter === "unassigned") ts = ts.filter((t) => !t.assignedTo && !t.assignedName);
    if (opsFilter === "urgent")
      ts = ts.filter(
        (t) => t.urgency === "Crítica" || t.urgency === "Alta" || t.priority === "Alta",
      );
    if (opsFilter === "ready") ts = ts.filter(isReadyToClose);
    ts = [...ts].sort((a, b) => {
      const rank = operationalRank(a) - operationalRank(b);
      if (rank !== 0) return rank;
      return (a.order || 0) - (b.order || 0);
    });
    return filterTasks(ts, searchQuery, mod, prio, phase);
  }, [
    tasks,
    searchQuery,
    mod,
    prio,
    phase,
    showArchived,
    overdueOnly,
    myWorkOnly,
    commentsOnly,
    localCommentTaskIds,
    appUser?.uid,
    appUserData?.name,
    systemFilter,
    typeFilter,
    responsibleFilter,
    slaFilter,
    opsFilter,
  ]);

  const operationalMetrics = useMemo(() => {
    const active = tasks.filter((t) => !t.archived);
    return {
      overdue: active.filter(isTaskOverdue).length,
      blocked: active.filter((t) => getOperationalState(t) === "blocked").length,
      unassigned: active.filter((t) => !t.assignedTo && !t.assignedName).length,
      urgent: active.filter(
        (t) => t.urgency === "Crítica" || t.urgency === "Alta" || t.priority === "Alta",
      ).length,
      ready: active.filter(isReadyToClose).length,
    };
  }, [tasks]);

  const opsCards = useMemo(
    () => [
      {
        key: "overdue",
        label: "Vencidas",
        value: operationalMetrics.overdue,
        icon: Flame,
        tone: "border-red-100 bg-red-50 text-red-700",
      },
      {
        key: "blocked",
        label: "Bloqueadas",
        value: operationalMetrics.blocked,
        icon: Lock,
        tone: "border-rose-100 bg-rose-50 text-rose-700",
      },
      {
        key: "unassigned",
        label: "Sin asignar",
        value: operationalMetrics.unassigned,
        icon: User,
        tone: "border-slate-200 bg-white text-slate-700",
      },
      {
        key: "urgent",
        label: "Alta urgencia",
        value: operationalMetrics.urgent,
        icon: Flag,
        tone: "border-amber-100 bg-amber-50 text-amber-700",
      },
      {
        key: "ready",
        label: "Cierre pendiente",
        value: operationalMetrics.ready,
        icon: CheckCircle2,
        tone: "border-emerald-100 bg-emerald-50 text-emerald-700",
      },
    ],
    [operationalMetrics],
  );

  const overdueCount = useMemo(() => {
    return tasks.filter((t) => !t.archived && isTaskOverdue(t)).length;
  }, [tasks]);

  const statusOptions = useMemo(
    () => uniqueOptions([...statuses, ...tasks.map((t) => t.status)]),
    [tasks],
  );

  const columns = useMemo(() => {
    const byCol = {};
    statusOptions.forEach((s) => (byCol[s] = []));
    displayedTasks.forEach((t) => {
      if (byCol[t.status]) byCol[t.status].push(t);
    });
    return statusOptions.map((s) => ({ status: s, items: byCol[s] }));
  }, [displayedTasks, statusOptions]);

  const moduleOptions = useMemo(
    () => uniqueOptions([...modules, ...tasks.map((t) => t.module)]),
    [tasks],
  );
  const phaseOptions = useMemo(
    () => uniqueOptions([...Object.keys(phaseMap), ...tasks.map((t) => t.phase)]),
    [tasks],
  );
  const systemOptions = useMemo(
    () => uniqueOptions([...(itConfig.systems || []), ...tasks.map((t) => t.system)]),
    [itConfig.systems, tasks],
  );
  const typeOptions = useMemo(
    () => uniqueOptions([...(itConfig.ticketTypes || []), ...tasks.map((t) => t.ticketType)]),
    [itConfig.ticketTypes, tasks],
  );
  const responsibleOptions = useMemo(
    () => uniqueOptions([...(itConfig.team || []), ...tasks.map((t) => t.assignedName)]),
    [itConfig.team, tasks],
  );

  const done = tasks.filter((t) => t.status === "Hecho").length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const effortDone = tasks
    .filter((t) => t.status === "Hecho")
    .reduce((a, t) => a + (effortWeight[t.effort] || 0), 0);
  const effortTotal = tasks.reduce((a, t) => a + (effortWeight[t.effort] || 0), 0);
  const effortProgress = effortTotal ? Math.round((effortDone / effortTotal) * 100) : 0;

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

  function addCatalogValue(key, value) {
    const clean = cleanValue(value);
    if (!clean) return;
    setItConfig((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];
      if (current.some((item) => item.toLowerCase() === clean.toLowerCase())) return prev;
      return { ...prev, [key]: [...current, clean] };
    });
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

  async function handleDragEnd(e) {
    const { active, over } = e;
    if (!over || !appCanEdit) {
      setActiveId(null);
      return;
    }

    const currentTasks = tasksRef.current;
    const taskId = String(active.id);
    const task = currentTasks.find((t) => t.id === taskId);
    if (!task) {
      setActiveId(null);
      return;
    }

    const overStr = String(over.id);
    let newStatus = null;
    let isReorder = false;

    if (overStr.startsWith("column-")) {
      newStatus = overStr.replace("column-", "");
    } else {
      const overTask = currentTasks.find((t) => t.id === overStr);
      if (overTask) {
        if (overTask.status !== task.status) {
          newStatus = overTask.status;
        } else if (taskId !== overStr) {
          isReorder = true;
        }
      }
    }

    if (newStatus || isReorder) {
      const opPatch =
        newStatus === "Bloqueado"
          ? { operationalState: "blocked" }
          : newStatus
            ? { operationalState: "normal" }
            : {};
      const targetStatus = newStatus || task.status;
      const colTasks = currentTasks
        .filter((t) => t.status === targetStatus && t.id !== taskId && !t.archived)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      let newOrder;
      if (newStatus) {
        if (overStr.startsWith("column-")) {
          newOrder =
            colTasks.length > 0 ? (colTasks[colTasks.length - 1].order || 0) + 1000 : Date.now();
        } else {
          const overIdx = colTasks.findIndex((t) => t.id === overStr);
          if (overIdx <= 0) {
            newOrder = colTasks.length > 0 ? (colTasks[0].order || 0) - 1000 : Date.now();
          } else {
            const prev = colTasks[overIdx - 1];
            const next = colTasks[overIdx];
            newOrder = ((prev.order || 0) + (next.order || 0)) / 2;
          }
        }
      } else {
        const dropIdx = colTasks.findIndex((t) => t.id === overStr);
        if (dropIdx <= 0) {
          newOrder = colTasks.length > 0 ? (colTasks[0].order || 0) - 1000 : Date.now();
        } else if (dropIdx >= colTasks.length) {
          newOrder =
            colTasks.length > 0 ? (colTasks[colTasks.length - 1].order || 0) + 1000 : Date.now();
        } else {
          newOrder = ((colTasks[dropIdx - 1].order || 0) + (colTasks[dropIdx].order || 0)) / 2;
        }
      }

      const optimisticPatch = {
        ...(newStatus ? { status: newStatus } : {}),
        ...opPatch,
        order: newOrder,
      };
      const previousTasks = currentTasks;
      const nextTasks = currentTasks.map((t) =>
        t.id === taskId ? { ...t, ...optimisticPatch } : t,
      );
      setTasks(nextTasks);
      tasksRef.current = nextTasks;

      if (isLocalDemo) {
        if (newStatus)
          createLocalLog(taskId, task.title, "status_changed", `${task.status} → ${newStatus}`);
        setActiveId(null);
        return;
      }
      try {
        const updates = { order: newOrder };
        if (newStatus) updates.status = newStatus;
        Object.assign(updates, opPatch);
        await taskService.updateTask(activeBoardId, taskId, updates, appActor);
        if (newStatus)
          createLog(taskId, task.title, "status_changed", `${task.status} → ${newStatus}`);
      } catch (e) {
        if (import.meta.env.DEV) console.error("Error updating task status:", e);
        setTasks(previousTasks);
        tasksRef.current = previousTasks;
        showToast("Error al actualizar el estado de la tarea");
      }
    }
    setActiveId(null);
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
      await taskService.updateTask(activeBoardId, id, {
        status: s,
        ...opPatch,
        order: Date.now(),
      }, appActor);
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

  function toggleCollapse(s) {
    setCollapsed((c) => ({ ...c, [s]: !c[s] }));
  }

  function openAddTask(status = "Pendiente") {
    setNewTaskStatus(status);
    setShowAdd(true);
  }

  function resetLocalDemo() {
    if (!confirm("¿Resetear datos locales demo?")) return;
    localStorage.removeItem(LOCAL_TASKS_KEY);
    Object.keys(localStorage)
      .filter((key) => key.startsWith(`${LOCAL_TASKS_KEY}.`))
      .forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem(LOCAL_COMMENTS_KEY);
    localStorage.removeItem(LOCAL_IT_CONFIG_KEY);
    localStorage.removeItem(LOCAL_LOGS_KEY);
    setItConfig(defaultItConfig);
    setTasks(initialTasks.map((t, idx) => enrichLocalTask(t, idx, defaultItConfig)));
  }

  function handleSidebarAction(action) {
    if (action === "all") {
      setMyWorkOnly(false);
      setCommentsOnly(false);
      setShowArchived(false);
      setOverdueOnly(false);
      setSearchQuery("");
      setMod("Todos");
      setPrio("Todas");
      setPhase("Todas");
      setSystemFilter("Todos");
      setTypeFilter("Todos");
      setSlaFilter("Todos");
      setResponsibleFilter("Todos");
      setOpsFilter("all");
      setViewMode("board");
    }
    if (action === "my-work") {
      setMyWorkOnly(true);
      setCommentsOnly(false);
      setShowArchived(false);
      setOverdueOnly(false);
      setOpsFilter("all");
      setViewMode("list");
    }
    if (action === "comments") {
      setCommentsOnly(true);
      setViewMode("list");
      setMyWorkOnly(false);
      setSearchQuery("");
      setShowArchived(false);
      setOverdueOnly(false);
      setOpsFilter("all");
    }
    if (action === "notifications") {
      setShowArchived(false);
      setMyWorkOnly(false);
      setCommentsOnly(false);
      setOverdueOnly(false);
      const nextFilter =
        operationalMetrics.overdue > 0
          ? "overdue"
          : operationalMetrics.blocked > 0
            ? "blocked"
            : operationalMetrics.urgent > 0
              ? "urgent"
              : operationalMetrics.ready > 0
                ? "ready"
                : "all";
      setOpsFilter(nextFilter);
      setViewMode("list");
    }
  }

  const activeBoardName = useMemo(() => {
    const b = appBoards.find((b) => b.id === appActiveBoardId);
    return b ? displayBoardName(b.name) : APP_NAME;
  }, [appBoards, appActiveBoardId]);

  const hasActiveViewFilters =
    searchQuery ||
    mod !== "Todos" ||
    prio !== "Todas" ||
    phase !== "Todas" ||
    systemFilter !== "Todos" ||
    typeFilter !== "Todos" ||
    slaFilter !== "Todos" ||
    responsibleFilter !== "Todos" ||
    opsFilter !== "all" ||
    myWorkOnly ||
    commentsOnly ||
    overdueOnly;

  function clearViewFilters() {
    setMyWorkOnly(false);
    setOverdueOnly(false);
    setSearchQuery("");
    setMod("Todos");
    setPrio("Todas");
    setPhase("Todas");
    setSystemFilter("Todos");
    setTypeFilter("Todos");
    setSlaFilter("Todos");
    setResponsibleFilter("Todos");
    setOpsFilter("all");
    setCommentsOnly(false);
  }

  if (loading) return <LoadingScreen />;

  if (showLoadingScreen) {
    const step = LOADING_STEPS[Math.min(loadingStep, LOADING_STEPS.length - 1)];
    return <LoadingScreen message={step.message} subtitle={step.subtitle} />;
  }

  if (!appUser) {
    return (
      <>
        <LandingPage onOpenLogin={() => setShowLoginModal(true)} />
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={kanbanCollisionDetection}
        onDragStart={(e) => setActiveId(String(e.active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="min-h-screen bg-slate-200/60 pb-20 md:pb-0">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
            <div className="mx-auto flex max-w-[1800px] items-center gap-3 px-3 py-1.5 md:px-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-600 text-[10px] font-black text-white shadow-sm">
                  {APP_MONOGRAM}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate text-sm font-black text-slate-900">
                      {activeBoardName}
                    </h1>
                    <MoreVertical className="hidden h-4 w-4 text-slate-300 md:block" />
                  </div>
                  <div className="hidden items-center gap-1 text-[10px] font-semibold text-slate-400 sm:flex">
                    <span>{tasks.length} tareas</span>
                    <span>·</span>
                    <span>{progress}% avance</span>
                    <span>·</span>
                    <span>{effortProgress}% esfuerzo</span>
                  </div>
                </div>
              </div>

              <div className="hidden h-8 items-center rounded-xl bg-slate-100 p-1 md:flex">
                <button
                  onClick={() => setViewMode("board")}
                  className={`flex h-6 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold ${viewMode === "board" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500"}`}
                >
                  <LayoutDashboard className="h-4 w-4" /> Kanban
                </button>
                <button
                  onClick={() => setViewMode("gantt")}
                  className={`flex h-6 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold ${viewMode === "gantt" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500"}`}
                >
                  <Calendar className="h-4 w-4" /> Gantt
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex h-6 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold ${viewMode === "list" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500"}`}
                >
                  <ListFilter className="h-4 w-4" /> Task list
                </button>
                <button
                  onClick={() => setViewMode("reports")}
                  className={`flex h-6 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold ${viewMode === "reports" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500"}`}
                >
                  <BarChart3 className="h-4 w-4" /> Reportes
                </button>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {overdueCount > 0 && !showArchived && (
                  <button
                    onClick={() => setOverdueOnly(!overdueOnly)}
                    className={`hidden h-8 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-bold md:flex ${overdueOnly ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-500"}`}
                  >
                    <Flame className="h-4 w-4" /> {overdueOnly ? "Todas" : overdueCount}
                  </button>
                )}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="flex h-10 sm:h-8 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <LayoutDashboard className="h-4 w-4" />{" "}
                  <span className="hidden sm:inline">Boards</span>
                </button>
                <div className="hidden items-center gap-2 md:flex">
                  <div className="relative">
                    <button
                      onClick={() => setShowActionsMenu(!showActionsMenu)}
                      className={`flex h-8 items-center gap-2 rounded-xl border px-2.5 text-xs font-bold transition-colors ${showActionsMenu ? "border-cyan-200 bg-cyan-50 text-cyan-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                    >
                      <MoreVertical className="h-4 w-4" /> Acciones
                    </button>
                    {showActionsMenu && (
                      <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                        <button
                          onClick={() => {
                            setShowArchived(!showArchived);
                            setShowActionsMenu(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50"
                        >
                          <Archive className="h-4 w-4 text-slate-400" />{" "}
                          {showArchived ? "Ver activas" : "Ver archivadas"}
                        </button>
                        <button
                          onClick={() => {
                            exportCSV();
                            setShowActionsMenu(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50"
                        >
                          <Download className="h-4 w-4 text-slate-400" /> Exportar CSV
                        </button>
                        {isLocalDemo && (
                          <button
                            onClick={() => {
                              setShowItConfig(true);
                              setShowActionsMenu(false);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50"
                          >
                            <Settings className="h-4 w-4 text-slate-400" /> Configuración IT
                          </button>
                        )}
                        {appIsAdmin && !isLocalDemo && (
                          <button
                            onClick={() => {
                              setShowAdmin(true);
                              setShowActionsMenu(false);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50"
                          >
                            <Settings className="h-4 w-4 text-slate-400" /> Admin
                          </button>
                        )}
                        {!isLocalDemo && (
                          <button
                            onClick={() => {
                              if (confirm("Cerrar sesion?")) logout();
                            }}
                            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-red-500 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" /> Salir
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <Avatar name={appUserData?.name || appUser.email} />
                </div>
                <div className="relative md:hidden">
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  >
                    <SlidersHorizontal className="h-5 w-5" />
                  </button>
                  {showMobileMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40 bg-slate-950/20 md:hidden"
                        onClick={() => setShowMobileMenu(false)}
                      />
                      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-slate-200 bg-white shadow-2xl p-3 pb-8 space-y-1 animate-in slide-in-from-bottom duration-200 md:absolute md:right-0 md:top-full md:mt-1 md:w-56 md:rounded-xl md:border md:p-2 md:pb-2 md:shadow-xl md:animate-none">
                      <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-100">
                        {appUserData?.name || appUser.email}
                        <span
                          className={`ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${appIsAdmin ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-500"}`}
                        >
                          {appIsAdmin ? "Admin" : "Member"}
                        </span>
                      </div>
                      {[
                        ["board", "Kanban"],
                        ["gantt", "Gantt"],
                        ["list", "Task list"],
                        ["reports", "Reportes"],
                      ].map(([mode, label]) => (
                        <button
                          key={mode}
                          onClick={() => {
                            setViewMode(mode);
                            setShowMobileMenu(false);
                          }}
                          className={`w-full text-left rounded-lg px-3 py-2 text-xs font-medium transition-colors ${viewMode === mode ? "bg-cyan-50 text-cyan-700" : "text-slate-600 hover:bg-slate-100"}`}
                        >
                          {label}
                        </button>
                      ))}
                      <div className="my-1 border-t border-slate-100" />
                      {appIsAdmin && !isLocalDemo && (
                        <button
                          onClick={() => {
                            setShowAdmin(true);
                            setShowMobileMenu(false);
                          }}
                          className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          Admin
                        </button>
                      )}
                      {isLocalDemo && (
                        <button
                          onClick={() => {
                            setShowItConfig(true);
                            setShowMobileMenu(false);
                          }}
                          className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          Configuración IT
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowArchived(!showArchived);
                          setShowMobileMenu(false);
                        }}
                        className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        {showArchived ? "Activas" : "Archivadas"}
                      </button>
                      {overdueCount > 0 && !showArchived && (
                        <button
                          onClick={() => {
                            setOverdueOnly(!overdueOnly);
                            setShowMobileMenu(false);
                          }}
                          className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          {overdueOnly ? "Todas" : `${overdueCount} vencidas`}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          exportCSV();
                          setShowMobileMenu(false);
                        }}
                        className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        Export CSV
                      </button>
                      {!isLocalDemo && (
                        <button
                          onClick={() => {
                            if (confirm("Cerrar sesion?")) logout();
                          }}
                          className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                        >
                          Salir
                        </button>
                      )}
                    </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1800px] px-3 py-3 md:px-4">
            <div className="mb-3 flex flex-col gap-2">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                <div className="relative min-w-[220px] flex-1 lg:max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar tarea, sistema o solicitante..."
                    className="h-11 md:h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none transition-colors focus:border-cyan-300"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {appCanCreate && (
                    <button
                      aria-label="Crear tarea"
                      onClick={() => openAddTask()}
                      className="flex h-10 sm:h-9 items-center gap-2 rounded-xl bg-cyan-600 px-3 text-xs font-black text-white hover:bg-cyan-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" /> Nueva tarea
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`h-10 sm:h-auto rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${showFilters ? "border-cyan-200 bg-cyan-50 text-cyan-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                  >
                    {showFilters
                      ? "Ocultar filtros"
                      : hasActiveViewFilters
                        ? "Filtros activos"
                        : "Filtros"}
                  </button>
                  {hasActiveViewFilters && (
                    <button
                      onClick={clearViewFilters}
                      className="h-10 sm:h-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"
                    >
                      Limpiar
                    </button>
                  )}
                  {appCanCreate && (
                    <button
                      aria-label={deleteMode ? "Salir de eliminar tareas" : "Eliminar tareas"}
                      title={deleteMode ? "Salir de eliminar tareas" : "Eliminar tareas"}
                      onClick={() => setDeleteMode(!deleteMode)}
                      className={`flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-xl border transition-colors ${deleteMode ? "border-red-500 bg-red-500 text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <span className="hidden text-xs font-bold text-slate-400 md:inline">
                    {displayedTasks.length} tareas
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {opsCards.map(({ key, label, value, icon: Icon, tone }) => (
                  <button
                    key={key}
                    onClick={() => setOpsFilter(opsFilter === key ? "all" : key)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-all ${opsFilter === key ? `${tone} ring-2 ring-cyan-200` : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200"}`}
                  >
                    <span className="flex items-center gap-2 text-xs font-black uppercase">
                      <Icon className="h-4 w-4" />
                      {label}
                    </span>
                    <span className="text-lg font-black">{value}</span>
                  </button>
                ))}
              </div>

              <div
                className={`${showFilters ? "grid" : "hidden"} grid-cols-2 gap-2 md:grid-cols-[repeat(8,minmax(0,auto))] md:items-center`}
              >
                <select
                  value={mod}
                  onChange={(e) => setMod(e.target.value)}
                  className="h-11 md:h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none"
                >
                  <option value="Todos">Módulos</option>
                  {moduleOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={prio}
                  onChange={(e) => setPrio(e.target.value)}
                  className="h-11 md:h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none"
                >
                  <option value="Todas">Prioridades</option>
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
                <select
                  value={phase}
                  onChange={(e) => setPhase(e.target.value)}
                  className="h-11 md:h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none"
                >
                  {["Todas", ...phaseOptions].map((p) => (
                    <option key={p} value={p}>
                      {p === "Todas" ? "Fases" : phaseMap[p] ? `${p} - ${phaseMap[p]}` : p}
                    </option>
                  ))}
                </select>
                <select
                  value={systemFilter}
                  onChange={(e) => setSystemFilter(e.target.value)}
                  className="h-11 md:h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none"
                >
                  <option value="Todos">Sistemas</option>
                  {systemOptions.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-11 md:h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none"
                >
                  <option value="Todos">Tipos</option>
                  {typeOptions.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <select
                  value={slaFilter}
                  onChange={(e) => setSlaFilter(e.target.value)}
                  className="h-11 md:h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none"
                >
                  <option value="Todos">SLA</option>
                  <option value="Con SLA">Con SLA</option>
                  <option value="Sin SLA">Sin SLA</option>
                  <option value="Vencidas">Vencidas</option>
                </select>
                <select
                  value={responsibleFilter}
                  onChange={(e) => setResponsibleFilter(e.target.value)}
                  className="h-11 md:h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none"
                >
                  <option value="Todos">Responsable</option>
                  {responsibleOptions.map((v) => (
                    <option key={v} value={v}>
                      {displayPersonName(v)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {viewMode === "list" ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="grid min-w-[1040px] grid-cols-[1fr_150px_130px_120px_120px_120px_120px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-400">
                  <span>Tarea</span>
                  <span>Responsable</span>
                  <span>Sistema</span>
                  <span>SLA</span>
                  <span>Vence</span>
                  <span>Estado</span>
                  <span>Prioridad</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {displayedTasks.map((task) => {
                    const S = statusMeta[task.status]?.icon || Circle;
                    const P = priorityMeta[task.priority]?.icon || Flag;
                    const op =
                      operationalStates[getOperationalState(task)] || operationalStates.normal;
                    const Op = op.icon;
                    return (
                      <button
                        key={task.id}
                        onClick={() => setDetailT(task)}
                        className="grid min-w-[1040px] w-full grid-cols-[1fr_150px_130px_120px_120px_120px_120px] gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-bold text-slate-900">
                            {task.title}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-400">
                            <Op className="h-3.5 w-3.5" />
                            {op.label}
                          </span>
                        </span>
                        <span className="truncate font-semibold text-slate-600">
                          {displayPersonName(task.assignedName) || "Sin asignar"}
                        </span>
                        <span className="truncate text-slate-600">
                          {task.system || "Sin sistema"}
                        </span>
                        <span className="font-semibold text-slate-600">
                          {task.slaHours ? `${task.slaHours}h` : "Sin SLA"}
                        </span>
                        <span
                          className={`font-semibold ${isTaskOverdue(task) ? "text-red-600" : "text-slate-500"}`}
                        >
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Sin fecha"}
                        </span>
                        <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                          <S className="h-4 w-4" />
                          {task.status}
                        </span>
                        <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                          <P className="h-4 w-4" />
                          {task.priority}
                        </span>
                      </button>
                    );
                  })}
                  {displayedTasks.length === 0 && (
                    <div className="px-4 py-10 text-center text-sm font-semibold text-slate-400">
                      No hay tareas con estos filtros.
                    </div>
                  )}
                </div>
              </div>
            ) : viewMode === "gantt" ? (
              <GanttView
                tasks={displayedTasks}
                onSelect={setDetailT}
                onAdd={openAddTask}
                canCreate={appCanCreate}
                canEdit={appCanEdit}
                onTaskPatch={patchTask}
              />
            ) : viewMode === "reports" ? (
              <ReportsView
                tasks={displayedTasks}
                allTasks={tasks}
                boardName={activeBoardName}
                onExport={exportVisibleCSV}
                onPrint={printReport}
                onSelect={setDetailT}
              />
            ) : (
              <>
                {tasks.length === 0 ? (
                  <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-center shadow-sm">
                    <LayoutDashboard className="mb-3 h-10 w-10 text-slate-300" />
                    <h2 className="text-sm font-black text-slate-800">
                      Este board no tiene tareas
                    </h2>
                    <p className="mt-1 max-w-sm text-xs font-semibold text-slate-400">
                      Crea la primera card para empezar a organizar este kanban.
                    </p>
                    {appCanCreate && (
                      <button
                        onClick={() => openAddTask("Pendiente")}
                        className="mt-4 flex h-11 md:h-9 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-xs font-black text-white hover:bg-cyan-700"
                      >
                        <Plus className="h-4 w-4" /> Nueva tarea
                      </button>
                    )}
                  </div>
                ) : displayedTasks.length === 0 ? (
                  <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-4 text-center shadow-sm">
                    <SearchX className="mb-3 h-10 w-10 text-slate-300" />
                    <h2 className="text-sm font-black text-slate-800">Sin resultados</h2>
                    <p className="mt-1 max-w-sm text-xs font-semibold text-slate-400">
                      Ninguna tarea coincide con los filtros actuales. Intenta ajustar los criterios
                      de búsqueda.
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Scroll fade indicators */}
                    <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-6 bg-gradient-to-r from-white to-transparent opacity-80 md:hidden" />
                    <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-6 bg-gradient-to-l from-white to-transparent opacity-80 md:hidden" />
                    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2">
                    {columns.map(({ status, items }) => (
                      <Column
                        key={status}
                        status={status}
                        items={items}
                        collapsed={collapsed}
                        toggleCollapse={toggleCollapse}
                        isAdmin={appCanEdit}
                        deleteMode={deleteMode}
                        onSelect={setDetailT}
                        onDelete={deleteTask}
                        onAdd={openAddTask}
                        onTaskPatch={patchTask}
                        isLocal={isLocalDemo}
                        users={users}
                        deletingId={deletingId}
                      />
                    ))}
                  </div>
                    </div>
                )}
              </>
            )}
          </div>
        </div>

        <Modal open={showAdd} onClose={() => setShowAdd(false)}>
          <TaskForm
            onSave={addTask}
            onClose={() => setShowAdd(false)}
            users={users}
            itConfig={itConfig}
            isLocal={isLocalDemo}
          />
        </Modal>

        <Modal open={!!editT} onClose={() => setEditT(null)}>
          {editT && (
            <TaskForm
              onSave={editTask}
              onClose={() => setEditT(null)}
              initial={editT}
              users={users}
              itConfig={itConfig}
              isLocal={isLocalDemo}
            />
          )}
        </Modal>

        <Modal open={!!detailT} onClose={() => setDetailT(null)} wide>
          <ErrorBoundary key={detailT?.id}>
            {detailT && (
              <TaskDetail
                task={detailT}
                onDelete={deleteTask}
                onClose={() => setDetailT(null)}
                onStatus={updateStatus}
                onArchive={archiveTask}
                isAdmin={appCanEdit}
                activeBoardId={isLocalDemo ? null : activeBoardId}
                users={users}
                onTaskPatch={patchTask}
                itConfig={itConfig}
                isLocal={isLocalDemo}
                deletingId={deletingId}
                onCatalogValue={addCatalogValue}
                moduleOptions={moduleOptions}
                phaseOptions={phaseOptions}
                statusOptions={statusOptions}
              />
            )}
          </ErrorBoundary>
        </Modal>

        <Modal open={showItConfig} onClose={() => setShowItConfig(false)}>
          <ITConfigPanel
            config={itConfig}
            onSave={setItConfig}
            onReset={resetLocalDemo}
            onClose={() => setShowItConfig(false)}
          />
        </Modal>

        <Modal open={showAdmin} onClose={() => setShowAdmin(false)}>
          <AdminPanel
            users={users}
            currentUser={appUser}
            onClose={() => setShowAdmin(false)}
            itConfig={itConfig}
          />
        </Modal>

        <DragOverlay>
          {activeTask && (
            <div className="rounded-xl border bg-white p-2.5 md:p-3 shadow-xl rotate-2 scale-105 ring-2 ring-slate-400">
              <CardContent task={activeTask} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Mobile FAB */}
      {appCanCreate && (
        <button
          onClick={() => openAddTask()}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-600 text-white shadow-xl hover:bg-cyan-700 active:scale-90 transition-all md:hidden"
          aria-label="Nueva tarea"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 items-center justify-center h-20 w-6 rounded-l-lg border border-r-0 border-slate-300 bg-white shadow-md text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
      >
        {sidebarOpen ? "▶" : "◀"}
      </button>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onQuickAction={handleSidebarAction}
        users={users}
      />
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
