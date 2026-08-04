import { useMemo, useState } from "react";
import { CheckCircle2, Flag, Flame, Lock, User } from "lucide-react";
import { statuses, phaseMap, modules, effortWeight } from "../../constants/meta";
import { LOCAL_COMMENTS_KEY } from "../../constants/storage";
import {
  readLocalJSON,
  isTaskOverdue,
  getOperationalState,
  isReadyToClose,
  operationalRank,
  uniqueOptions,
} from "../../lib/utils";
import { filterTasks } from "../../lib/kanban";

/**
 * useFilters — estado de filtros y todo lo derivado (tareas visibles, métricas, columnas, opciones).
 * useFilters — filter state and all derived data (visible tasks, metrics, columns, options).
 */
export function useFilters({ tasks, isLocalDemo, appUser, appUserData, itConfig, setViewMode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [mod, setMod] = useState("Todos");
  const [prio, setPrio] = useState("Todas");
  const [phase, setPhase] = useState("Todas");
  const [systemFilter, setSystemFilter] = useState("Todos");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [slaFilter, setSlaFilter] = useState("Todos");
  const [responsibleFilter, setResponsibleFilter] = useState("Todos");
  const [opsFilter, setOpsFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [myWorkOnly, setMyWorkOnly] = useState(false);
  const [commentsOnly, setCommentsOnly] = useState(false);

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

  return {
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
  };
}
