import { useState, useMemo, useEffect, useCallback } from "react";
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
  Circle,
  Download,
  Flag,
  Flame,
  LayoutDashboard,
  ListFilter,
  MoreVertical,
  Plus,
  Search,
  SearchX,
  Settings,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { useBoard } from "./BoardContext";
import { useServices } from "./presentation/context/ServicesContext";
import Sidebar from "./Sidebar";
import { APP_MONOGRAM, APP_NAME, displayBoardName } from "./branding";

// Constants
import { initialTasks } from "./constants/tasks";
import { defaultItConfig } from "./constants/defaultItConfig";
import { statusMeta, priorityMeta, operationalStates, phaseMap } from "./constants/meta";
import {
  LOCAL_TASKS_KEY,
  LOCAL_COMMENTS_KEY,
  LOCAL_IT_CONFIG_KEY,
  LOCAL_LOGS_KEY,
} from "./constants/storage";

// Utils
import { enrichLocalTask, displayPersonName, isTaskOverdue, getOperationalState } from "./lib/utils";
import { kanbanCollisionDetection } from "./lib/kanban";

// Presentation hooks
import { useBoardData } from "./presentation/hooks/useBoardData";
import { useUsers } from "./presentation/hooks/useUsers";
import { useItConfig } from "./presentation/hooks/useItConfig";
import { usePermissions } from "./presentation/hooks/usePermissions";
import { useTaskActions } from "./presentation/hooks/useTaskActions";
import { useFilters } from "./presentation/hooks/useFilters";
import { useCsv } from "./presentation/hooks/useCsv";

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

  const [activeId, setActiveId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState("Pendiente");
  const [editT, setEditT] = useState(null);
  const [detailT, setDetailT] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [showAdmin, setShowAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [viewMode, setViewMode] = useState("board");
  const [showItConfig, setShowItConfig] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = "error") => setToast({ message: msg, type }), []);

  const { appIsAdmin, appActor, appCanCreate, appCanEdit } = usePermissions({
    isAdmin,
    isLocalDemo,
    appUser,
    appUserData,
  });
  const { itConfig, setItConfig, addCatalogValue } = useItConfig({ isLocalDemo });
  const { tasks, setTasks, tasksRef } = useBoardData({
    isLocalDemo,
    user,
    activeBoardId,
    itConfig,
    showToast,
    taskService,
    appActor,
    setDetailT,
    setActiveId,
  });
  const { users } = useUsers({ isLocalDemo, user, userData, appIsAdmin, userService });
  const {
    createLog,
    createLocalLog,
    archiveTask,
    updateStatus,
    deleteTask,
    addTask,
    editTask,
    patchTask,
  } = useTaskActions({
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
  });
  const {
    searchQuery,
    setSearchQuery,
    mod,
    setMod,
    prio,
    setPrio,
    phase,
    setPhase,
    systemFilter,
    setSystemFilter,
    typeFilter,
    setTypeFilter,
    slaFilter,
    setSlaFilter,
    responsibleFilter,
    setResponsibleFilter,
    opsFilter,
    setOpsFilter,
    showArchived,
    setShowArchived,
    overdueOnly,
    setOverdueOnly,
    displayedTasks,
    opsCards,
    overdueCount,
    progress,
    effortProgress,
    statusOptions,
    moduleOptions,
    phaseOptions,
    systemOptions,
    typeOptions,
    responsibleOptions,
    columns,
    hasActiveViewFilters,
    clearViewFilters,
    handleSidebarAction,
  } = useFilters({ tasks, isLocalDemo, appUser, appUserData, itConfig, setViewMode });
  const { exportCSV, exportVisibleCSV, printReport } = useCsv({ tasks, displayedTasks });

  const activeTask = useMemo(() => tasks.find((t) => t.id === activeId), [activeId, tasks]);
  const activeBoardName = useMemo(() => {
    const b = appBoards.find((b) => b.id === appActiveBoardId);
    return b ? displayBoardName(b.name) : APP_NAME;
  }, [appBoards, appActiveBoardId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
