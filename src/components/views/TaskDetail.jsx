import { useState, useEffect, useMemo } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  increment,
  limit,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../../firebase";
import { useAuth } from "../../AuthContext";
import {
  Circle,
  Clock3,
  CheckCircle2,
  MessageSquare,
  Archive,
  Trash2,
  Settings,
  X,
  SlidersHorizontal,
  Users,
  Plus,
  Calendar,
  User,
  MoreVertical,
  Send,
  Upload,
  FileText,
  Loader2,
} from "lucide-react";
import {
  statuses,
  phaseMap,
  priorityMeta,
  statusMeta,
  operationalStates,
  effortWeight,
} from "../../constants/meta";
import { defaultItConfig } from "../../constants/defaultItConfig";
import {
  checklistProgress,
  getOperationalState,
  readLocalJSON,
  writeLocalJSON,
  cleanValue,
  displayPersonName,
  fileToBase64,
  formatFileSize,
} from "../../lib/utils";
import { LOCAL_COMMENTS_KEY, LOCAL_LOGS_KEY, LOCAL_ATTACHMENTS_KEY } from "../../constants/storage";
import EditableCombo from "../ui/EditableCombo";
import Avatar from "../ui/Avatar";
import FieldPill from "../ui/FieldPill";
import DueDateBadge from "../ui/DueDateBadge";

export default function TaskDetail({
  task,
  onDelete,
  onClose,
  onStatus,
  isAdmin,
  onArchive,
  activeBoardId,
  users,
  onTaskPatch,
  itConfig = defaultItConfig,
  isLocal = false,
  deletingId,
  onCatalogValue,
  moduleOptions = [],
  phaseOptions = [],
  statusOptions = statuses,
}) {
  const [logs, setLogs] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [newChecklistText, setNewChecklistText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const { user, userData } = useAuth();
  const isLocalDetailDemo = !user && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const detailUser =
    user || (isLocalDetailDemo ? { uid: "local-demo-user", email: "demo@norahr.local" } : null);
  const detailUserData = userData || (isLocalDetailDemo ? { name: "IT Manager" } : null);
  const statusOrder = ["Pendiente", "En progreso", "Bloqueado", "Hecho"];
  const currentIdx = statusOrder.indexOf(task.status);
  const progress = currentIdx < 0 ? 0 : Math.round((currentIdx / (statusOrder.length - 1)) * 100);
  const status = statusMeta[task.status] || statusMeta.Pendiente;
  const StatusIcon = status.icon;
  const operationalKey = getOperationalState(task);
  const operationalMeta = operationalStates[operationalKey] || {
    ...operationalStates.normal,
    label: operationalKey || "Normal",
  };
  const OperationalIcon = operationalMeta.icon;

  const availableStatuses = isAdmin
    ? statusOptions.filter((s) => s !== task.status)
    : statuses.filter((s) => {
        const targetIdx = statusOrder.indexOf(s);
        return targetIdx > currentIdx && s !== "Bloqueado";
      });

  const slaCompliance = useMemo(() => {
    if (!task.slaHours || !task.dueDate) return null;
    const now = new Date();
    const due = new Date(task.dueDate);
    const diffMs = due - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    const totalSla = task.slaHours;
    const remainingPct = Math.round((diffHours / totalSla) * 100);
    if (task.status === "Hecho")
      return {
        status: "completado",
        label: "Completado",
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      };
    if (diffMs < 0)
      return {
        status: "vencido",
        label: "Vencido",
        color: "text-red-600 bg-red-50 border-red-200",
        remainingPct: 0,
      };
    if (remainingPct <= 25)
      return {
        status: "por-vencer",
        label: "Por vencer",
        color: "text-amber-600 bg-amber-50 border-amber-200",
        remainingPct,
      };
    return {
      status: "en-plazo",
      label: "En plazo",
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      remainingPct,
    };
  }, [task.slaHours, task.dueDate, task.status]);

  function InlineField({ label, children }) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
        {children}
      </div>
    );
  }

  useEffect(() => {
    if (!activeBoardId && task.id) {
      const allLogs = readLocalJSON(LOCAL_LOGS_KEY, {});
      setLogs(allLogs[task.id] || []);
      const all = readLocalJSON(LOCAL_COMMENTS_KEY, {});
      setComments(all[task.id] || []);
      return;
    }
    if (!activeBoardId) return;
    const q = query(
      collection(db, "boards", activeBoardId, "logs"),
      where("taskId", "==", task.id),
      orderBy("createdAt", "desc"),
      limit(30),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error("Logs listener error:", err);
      },
    );
    return unsub;
  }, [task.id, activeBoardId]);

  useEffect(() => {
    if (activeBoardId && task.id) {
      const q = query(
        collection(db, "boards", activeBoardId, "tasks", task.id, "comments"),
        orderBy("createdAt", "asc"),
        limit(100),
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (err) => {
          console.error("Comments listener error:", err);
        },
      );
      return unsub;
    }
  }, [task.id, activeBoardId]);

  async function sendComment(e) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || !detailUser) return;
    if (!activeBoardId) {
      const nextComment = {
        id: `local-comment-${Date.now()}`,
        text,
        userId: detailUser.uid,
        userName: detailUserData?.name || detailUser.email,
        createdAt: new Date().toISOString(),
      };
      const all = readLocalJSON(LOCAL_COMMENTS_KEY, {});
      const next = { ...all, [task.id]: [...(all[task.id] || []), nextComment] };
      writeLocalJSON(LOCAL_COMMENTS_KEY, next);
      setComments(next[task.id]);
      onTaskPatch?.(task.id, { commentsCount: next[task.id].length });
      setCommentText("");
      return;
    }
    try {
      await addDoc(collection(db, "boards", activeBoardId, "tasks", task.id, "comments"), {
        text,
        userId: user.uid,
        userName: userData?.name || user.email,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "boards", activeBoardId, "tasks", task.id), {
        commentsCount: increment(1),
        updatedAt: serverTimestamp(),
      });
      setCommentText("");
    } catch (err) {
      console.error("Error creating comment:", err);
    }
  }

  function formatTimestamp(ts) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "ahora";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString();
  }

  const actionLabels = {
    created: "creó esta tarea",
    updated: "editó esta tarea",
    deleted: "eliminó esta tarea",
    status_changed: "cambió el estado",
    assigned: "asignó esta tarea",
    archived: "archivó esta tarea",
    restored: "restauró esta tarea",
  };

  function updateField(field, value) {
    if (!isAdmin) return;
    onTaskPatch?.(task.id, { [field]: value });
  }

  function commitField(field, value, catalogKey) {
    if (!isAdmin) return;
    const next = cleanValue(value);
    onTaskPatch?.(task.id, { [field]: next });
    if (catalogKey && next) onCatalogValue?.(catalogKey, next);
  }

  function markDone() {
    if (task.status === "Hecho") {
      onStatus(task.id, "En progreso");
      return;
    }
    const currentChecklist = checklistProgress(task);
    if (currentChecklist.total > 0 && currentChecklist.done < currentChecklist.total) {
      const ok = confirm(
        `El checklist está incompleto (${currentChecklist.done}/${currentChecklist.total}). ¿Marcar como hecho de todos modos?`,
      );
      if (!ok) return;
    }
    onStatus(task.id, "Hecho");
  }

  function assignToMe() {
    if (!detailUser) return;
    onTaskPatch?.(task.id, {
      assignedTo: detailUser.uid,
      assignedName: detailUserData?.name || detailUser.email,
    });
  }

  function patchChecklist(checklist) {
    onTaskPatch?.(task.id, { checklist });
  }

  function toggleCheckItem(id) {
    patchChecklist(
      (task.checklist || []).map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
    );
  }

  function addChecklistItem(value = newChecklistText) {
    const text = cleanValue(value);
    if (!text) return;
    patchChecklist([...(task.checklist || []), { id: `check-${Date.now()}`, text, done: false }]);
    setNewChecklistText("");
  }

  function updateChecklistItem(id, text) {
    patchChecklist(
      (task.checklist || []).map((item) => (item.id === id ? { ...item, text } : item)),
    );
  }

  function removeChecklistItem(id) {
    patchChecklist((task.checklist || []).filter((item) => item.id !== id));
  }

  // ── Attachments ────────────────────────────────────────
  const existingAttachments = task.attachments || [];

  async function handleUploadFile(e) {
    const file = e.target?.files?.[0];
    if (!file) return;
    setUploadError("");
    // Local mode size limit
    if (isLocalDetailDemo && file.size > 4 * 1024 * 1024) {
      setUploadError("El archivo es demasiado grande para modo local (máx 4 MB)");
      if (e.target) e.target.value = "";
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      const attachment = isLocalDetailDemo
        ? await uploadLocalAttachment(file)
        : await uploadFirebaseAttachment(file);
      const currentAttachments = task.attachments || [];
      const updated = [...currentAttachments, attachment];
      onTaskPatch?.(task.id, { attachments: updated });
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError("Error al subir el archivo. Intenta de nuevo.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (e.target) e.target.value = "";
    }
  }

  async function uploadFirebaseAttachment(file) {
    const path = `boards/${activeBoardId}/tasks/${task.id}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytesResumable(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return { name: file.name, url, path, type: file.type, size: file.size, uploadedAt: Date.now() };
  }

  async function uploadLocalAttachment(file) {
    const dataUrl = await fileToBase64(file);
    const all = readLocalJSON(LOCAL_ATTACHMENTS_KEY, {});
    const id = `attach-${Date.now()}`;
    all[id] = dataUrl;
    writeLocalJSON(LOCAL_ATTACHMENTS_KEY, all);
    return { id, name: file.name, url: dataUrl, path: `local:${id}`, type: file.type, size: file.size, uploadedAt: Date.now() };
  }

  async function handleDeleteAttachment(attachment) {
    if (!isAdmin) return;
    const ok = confirm(`¿Eliminar "${attachment.name}"?`);
    if (!ok) return;
    try {
      if (!isLocalDetailDemo) {
        try { await deleteObject(ref(storage, attachment.path)); } catch { /* already gone */ }
      } else {
        const all = readLocalJSON(LOCAL_ATTACHMENTS_KEY, {});
        const localId = attachment.path?.replace("local:", "");
        if (localId) delete all[localId];
        writeLocalJSON(LOCAL_ATTACHMENTS_KEY, all);
      }
      const updated = existingAttachments.filter((a) => a.path !== attachment.path);
      onTaskPatch?.(task.id, { attachments: updated });
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  function goToSection(id, tab = "details") {
    setActiveTab(tab);
    window.setTimeout(() => {
      const section = document.getElementById(id);
      section?.scrollIntoView({ behavior: "smooth", block: "start" });
      section?.querySelector("input, textarea, select, button")?.focus?.();
    }, 60);
  }

  const checklist = checklistProgress(task);

  const mutedInput =
    "w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-cyan-400";
  const readonlyText = "mt-1 truncate text-xs font-bold text-slate-700";

  const commentsPanel = (
    <div className="flex min-h-[420px] flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Actividad</h3>
          <p className="text-xs text-slate-400">
            {comments.length} comentarios · {logs.length} eventos
          </p>
        </div>
        <MessageSquare className="h-5 w-5 text-slate-300" />
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar name={c.userName} />
            <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-4 py-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-bold text-slate-800">{c.userName}</span>
                <span className="shrink-0 text-[10px] text-slate-400">
                  {formatTimestamp(c.createdAt)}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{c.text}</p>
            </div>
          </div>
        ))}

        {logs.map((l) => (
          <div key={l.id} className="flex gap-3 text-sm">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-300" />
            <div>
              <span className="font-semibold text-slate-700">{l.userName}</span>{" "}
              <span className="text-slate-500">{actionLabels[l.action] || l.action}</span>
              {l.details && <span className="text-slate-400"> · {l.details}</span>}
              <span className="ml-1 text-xs text-slate-300">{formatTimestamp(l.createdAt)}</span>
            </div>
          </div>
        ))}

        {comments.length === 0 && logs.length === 0 && (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center text-slate-300">
            <MessageSquare className="mb-3 h-12 w-12" />
            <p className="text-sm font-semibold">No hay actividad todavía</p>
            <p className="mt-1 max-w-sm text-sm">
              Comenta o cambia el estado para iniciar la conversación.
            </p>
          </div>
        )}
      </div>
      <form
        onSubmit={sendComment}
        className="m-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
      >
        <MessageSquare className="ml-2 h-4 w-4 text-slate-300" />
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Comenta o menciona contexto para esta tarea..."
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-xs outline-none placeholder:text-slate-300"
        />
        <button
          disabled={!commentText.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-600 text-white transition-colors hover:bg-cyan-700 disabled:bg-slate-200"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex h-[92vh] min-h-[620px] flex-col overflow-hidden rounded-2xl bg-white text-slate-900">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4">
        <div className="flex min-w-0 items-center gap-1">
          {[
            ["details", "Card details"],
            ["activity", "Activity"],
            ["timing", "Timing"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`h-14 border-b-2 px-4 text-sm font-bold transition-colors ${activeTab === key ? "border-cyan-600 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-700"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("activity")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-50 hover:text-slate-700"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-100/80 px-4 py-3">
        <button
          onClick={markDone}
          className="flex items-center gap-3 rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50"
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-black ${task.status === "Hecho" ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-emerald-600"}`}
          >
            {progress}
          </span>
          {task.status === "Hecho" ? "Reopen" : "Mark as done"}
        </button>
        <div className="flex items-center gap-2 text-slate-400">
          {isAdmin && (
            <button
              onClick={() => onArchive(task.id, !task.archived)}
              disabled={deletingId === task.id}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white hover:text-slate-700 disabled:opacity-40"
              title={task.archived ? "Restaurar" : "Archivar"}
            >
              <Archive className="h-5 w-5" />
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => {
                if (confirm("¿Eliminar esta tarea?")) {
                  onDelete(task.id);
                  onClose();
                }
              }}
              disabled={deletingId === task.id}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white hover:text-red-600 disabled:opacity-40"
              title="Eliminar"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={() => setActiveTab("details")}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white hover:text-slate-700"
            title="Detalles"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col bg-slate-100/70 lg:flex-row">
        <main className="min-h-0 flex-1 overflow-y-auto">
          {activeTab === "details" && (
            <div className="grid min-h-full lg:grid-cols-[minmax(360px,42%)_1fr]">
              <div className="border-r border-slate-200 bg-white">
                <section className="space-y-5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar
                        name={task.assignedName || detailUserData?.name || detailUser?.email}
                        size="lg"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-400">
                          {task.updatedAt
                            ? `Actualizada ${formatTimestamp(task.updatedAt)}`
                            : "Detalle de tarea"}
                        </p>
                        {isAdmin ? (
                          <textarea
                            value={task.title || ""}
                            onChange={(e) => updateField("title", e.target.value)}
                            rows={2}
                            className="mt-1 w-full resize-none rounded-lg border border-transparent bg-transparent px-1 text-2xl font-bold leading-tight text-slate-950 outline-none hover:border-slate-200 focus:border-cyan-400"
                          />
                        ) : (
                          <h2 className="mt-1 text-2xl font-bold leading-tight text-slate-950">
                            {task.title}
                          </h2>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <FieldPill icon={StatusIcon} className={status.soft}>
                        {task.status}
                      </FieldPill>
                      <FieldPill icon={OperationalIcon} className={operationalMeta.tone}>
                        {operationalMeta.label}
                      </FieldPill>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <InlineField label="List">
                      {isAdmin ? (
                        <EditableCombo
                          value={task.status || "Pendiente"}
                          options={statusOptions}
                          onCommit={(value) => value && onStatus(task.id, value)}
                          className={mutedInput}
                        />
                      ) : (
                        <p className={readonlyText}>{task.status}</p>
                      )}
                    </InlineField>
                    <InlineField label="Priority">
                      {isAdmin ? (
                        <EditableCombo
                          value={task.priority || "Media"}
                          options={Object.keys(priorityMeta)}
                          onCommit={(value) => commitField("priority", value || "Media")}
                          className={mutedInput}
                        />
                      ) : (
                        <p className={readonlyText}>{task.priority}</p>
                      )}
                    </InlineField>
                    <InlineField label="System">
                      {isAdmin ? (
                        <EditableCombo
                          value={task.system || ""}
                          options={itConfig.systems}
                          onCommit={(value) => commitField("system", value, "systems")}
                          className={mutedInput}
                        />
                      ) : (
                        <p className={readonlyText}>{task.system || "Sin definir"}</p>
                      )}
                    </InlineField>
                    <InlineField label="Type">
                      {isAdmin ? (
                        <EditableCombo
                          value={task.ticketType || ""}
                          options={itConfig.ticketTypes}
                          onCommit={(value) => commitField("ticketType", value, "ticketTypes")}
                          className={mutedInput}
                        />
                      ) : (
                        <p className={readonlyText}>{task.ticketType || "Sin definir"}</p>
                      )}
                    </InlineField>
                    <InlineField label="Decisión manager">
                      {isAdmin ? (
                        <EditableCombo
                          value={task.operationalState || "normal"}
                          options={Object.keys(operationalStates)}
                          onCommit={(value) => commitField("operationalState", value || "normal")}
                          className={mutedInput}
                        />
                      ) : (
                        <p className={readonlyText}>{operationalMeta.label}</p>
                      )}
                    </InlineField>
                    <InlineField label="Motivo bloqueo">
                      {isAdmin ? (
                        <input
                          value={task.blockedReason || ""}
                          onChange={(e) => updateField("blockedReason", e.target.value)}
                          placeholder="Dependencia, proveedor, acceso..."
                          className={mutedInput}
                        />
                      ) : (
                        <p className={readonlyText}>{task.blockedReason || "Sin motivo"}</p>
                      )}
                    </InlineField>
                  </div>

                  <div id="task-description" className="rounded-xl border border-slate-200">
                    <div className="border-b border-slate-200 px-4 py-3">
                      <h3 className="text-xs font-bold uppercase text-slate-400">Description</h3>
                    </div>
                    {isAdmin ? (
                      <textarea
                        value={task.description || ""}
                        onChange={(e) => updateField("description", e.target.value)}
                        rows={4}
                        placeholder="Add description"
                        className="min-h-[116px] w-full resize-none rounded-b-xl bg-white px-4 py-4 text-sm leading-7 text-slate-600 outline-none placeholder:text-slate-300 focus:bg-slate-50"
                      />
                    ) : (
                      <p className="min-h-[96px] px-4 py-4 text-sm leading-7 text-slate-600">
                        {task.description || "Sin descripción"}
                      </p>
                    )}
                  </div>

                  <section
                    id="task-assignees"
                    className="scroll-mt-4 border-t border-slate-200 pt-5"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-900">Assignees</h3>
                      {!task.assignedTo && !task.assignedName && isAdmin ? (
                        <button
                          onClick={assignToMe}
                          className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-700"
                        >
                          Asignarme
                        </button>
                      ) : (
                        <Users className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                    {isLocal ? (
                      <EditableCombo
                        value={task.assignedName || ""}
                        options={itConfig.team}
                        onCommit={(value) => {
                          const name = cleanValue(value);
                          onTaskPatch?.(task.id, {
                            assignedName: name,
                            assignedTo: name ? `local-${name}` : "",
                          });
                          if (name) onCatalogValue?.("team", name);
                        }}
                        placeholder="Sin asignar"
                        className={mutedInput}
                      />
                    ) : isAdmin && users?.length > 0 ? (
                      <select
                        value={task.assignedTo || ""}
                        onChange={(e) => {
                          const userId = e.target.value;
                          const u = users.find((uu) => uu.id === userId);
                          onTaskPatch?.(task.id, {
                            assignedTo: userId,
                            assignedName: u ? u.name : "",
                          });
                        }}
                        className={mutedInput}
                      >
                        <option value="">Sin asignar</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                        {task.assignedName ? (
                          <Avatar name={task.assignedName} />
                        ) : (
                          <User className="h-5 w-5 text-slate-300" />
                        )}
                        <span className="text-sm font-semibold text-slate-700">
                          {displayPersonName(task.assignedName) || "Sin asignar"}
                        </span>
                      </div>
                    )}
                  </section>

                  <section id="task-dates" className="scroll-mt-4 border-t border-slate-200 pt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black text-slate-900">Start & Due date</h3>
                        <p className="text-xs text-slate-400">
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString()
                            : "Sin fecha límite"}
                        </p>
                      </div>
                      <Calendar className="h-5 w-5 text-slate-300" />
                    </div>
                    {isAdmin ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InlineField label="Start">
                          <input
                            type="date"
                            value={task.startDate || ""}
                            onChange={(e) => updateField("startDate", e.target.value)}
                            className={mutedInput}
                          />
                        </InlineField>
                        <InlineField label="Due">
                          <input
                            type="date"
                            value={task.dueDate || ""}
                            onChange={(e) => updateField("dueDate", e.target.value)}
                            className={mutedInput}
                          />
                        </InlineField>
                      </div>
                    ) : task.dueDate ? (
                      <div className="flex flex-wrap gap-2">
                        <FieldPill icon={Calendar}>
                          {task.startDate
                            ? `Inicio ${new Date(task.startDate).toLocaleDateString()}`
                            : "Sin inicio"}
                        </FieldPill>
                        <DueDateBadge dueDate={task.dueDate} />
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">Sin fecha límite</p>
                    )}
                  </section>

                  <section
                    id="task-checklist"
                    className="scroll-mt-4 border-t border-slate-200 pt-5"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black text-slate-900">Checklist</h3>
                        <p className="text-xs text-slate-400">
                          {checklist.done}/{checklist.total} completado
                        </p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={addChecklistItem}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-cyan-600 hover:text-white"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {(task.checklist || []).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"
                        >
                          <button
                            type="button"
                            onClick={() => isAdmin && toggleCheckItem(item.id)}
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${item.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent"}`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                          {isAdmin ? (
                            <input
                              value={item.text}
                              onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                              className={`min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none ${item.done ? "text-slate-400 line-through" : "text-slate-700"}`}
                            />
                          ) : (
                            <span
                              className={`min-w-0 flex-1 text-sm font-semibold ${item.done ? "text-slate-400 line-through" : "text-slate-700"}`}
                            >
                              {item.text}
                            </span>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => removeChecklistItem(item.id)}
                              className="text-slate-300 hover:text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {(!task.checklist || task.checklist.length === 0) && (
                        <p className="text-sm text-slate-400">Sin checklist todavía.</p>
                      )}
                      {isAdmin && (
                        <div className="flex gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-2">
                          <input
                            id="new-checklist-item"
                            value={newChecklistText}
                            onChange={(e) => setNewChecklistText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addChecklistItem();
                              }
                            }}
                            placeholder="Agregar item de checklist"
                            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400"
                          />
                          <button
                            type="button"
                            onClick={() => addChecklistItem()}
                            disabled={!newChecklistText.trim()}
                            className="rounded-lg bg-cyan-600 px-3 text-xs font-bold text-white hover:bg-cyan-700 disabled:bg-slate-200"
                          >
                            Agregar
                          </button>
                        </div>
                      )}
                    </div>
                  </section>

                  <section
                    id="task-attachments"
                    className="scroll-mt-4 border-t border-slate-200 pt-5"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-900">
                        Archivos
                        {existingAttachments.length > 0 && (
                          <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-500">
                            {existingAttachments.length}
                          </span>
                        )}
                      </h3>
                      {isAdmin && (
                        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-cyan-600 hover:text-white disabled:opacity-50">
                          {uploading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              {uploadProgress}%
                            </>
                          ) : (
                            <>
                              <Upload className="h-3.5 w-3.5" />
                              Subir
                            </>
                          )}
                          <input
                            type="file"
                            className="hidden"
                            disabled={uploading}
                            onChange={handleUploadFile}
                          />
                        </label>
                      )}
                    </div>
                    {uploadError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                        {uploadError}
                      </div>
                    )}
                    {existingAttachments.length === 0 ? (
                      <p className="text-sm text-slate-400">Sin archivos adjuntos.</p>
                    ) : (
                      <div className="space-y-2">
                        {existingAttachments.map((att, idx) => (
                          <div
                            key={att.path || idx}
                            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                          >
                            <FileText className="h-5 w-5 shrink-0 text-slate-400" />
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700 hover:text-cyan-600 hover:underline"
                              title={att.name}
                            >
                              {att.name}
                            </a>
                            <span className="shrink-0 text-xs text-slate-400">
                              {formatFileSize(att.size)}
                            </span>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteAttachment(att)}
                                disabled={uploading}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                                title="Eliminar archivo"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section
                    id="task-properties"
                    className="scroll-mt-4 border-t border-slate-200 pt-5"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-900">Custom properties</h3>
                      <SlidersHorizontal className="h-5 w-5 text-slate-300" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {isAdmin ? (
                        <>
                          <InlineField label="Module">
                            <EditableCombo
                              value={task.module || ""}
                              options={moduleOptions}
                              onCommit={(value) => commitField("module", value)}
                              className={mutedInput}
                            />
                          </InlineField>
                          <InlineField label="Phase">
                            <EditableCombo
                              value={task.phase || "V1"}
                              options={phaseOptions}
                              onCommit={(value) => commitField("phase", value || "V1")}
                              className={mutedInput}
                            />
                          </InlineField>
                          <InlineField label="Impact">
                            <EditableCombo
                              value={task.impact || ""}
                              options={itConfig.impacts}
                              onCommit={(value) => commitField("impact", value, "impacts")}
                              className={mutedInput}
                            />
                          </InlineField>
                          <InlineField label="Urgency">
                            <EditableCombo
                              value={task.urgency || ""}
                              options={itConfig.urgencies}
                              onCommit={(value) => commitField("urgency", value, "urgencies")}
                              className={mutedInput}
                            />
                          </InlineField>
                          <InlineField label="Effort">
                            <EditableCombo
                              value={task.effort || "Medio"}
                              options={Object.keys(effortWeight)}
                              onCommit={(value) => commitField("effort", value || "Medio")}
                              className={mutedInput}
                            />
                          </InlineField>
                          <InlineField label="SLA hours">
                            <input
                              value={task.slaHours || ""}
                              onChange={(e) =>
                                updateField("slaHours", Number(e.target.value) || "")
                              }
                              type="number"
                              min="1"
                              className={mutedInput}
                            />
                          </InlineField>
                          <InlineField label="Requester">
                            <input
                              value={task.requester || ""}
                              onChange={(e) => updateField("requester", e.target.value)}
                              placeholder="Solicitante"
                              className={mutedInput}
                            />
                          </InlineField>
                        </>
                      ) : (
                        <>
                          {[
                            ["Module", task.module || "Sin definir"],
                            [
                              "Phase",
                              task.phase
                                ? `${task.phase} - ${phaseMap[task.phase]}`
                                : "Sin definir",
                            ],
                            ["Impact", task.impact || "Sin definir"],
                            ["Urgency", task.urgency || "Sin definir"],
                            ["Effort", task.effort || "Sin definir"],
                            ["SLA", task.slaHours ? `${task.slaHours}h` : "Sin definir"],
                            ["Requester", task.requester || "Sin definir"],
                          ].map(([label, value]) => (
                            <InlineField key={label} label={label}>
                              <p className={readonlyText}>{value}</p>
                            </InlineField>
                          ))}
                        </>
                      )}
                    </div>
                  </section>
                </section>
              </div>
              <div className="min-h-0 p-4">{commentsPanel}</div>
            </div>
          )}

          {activeTab === "activity" && <div className="mx-auto max-w-4xl p-4">{commentsPanel}</div>}

          {activeTab === "timing" && (
            <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-950">Timing</h3>
                  <Clock3 className="h-5 w-5 text-slate-300" />
                </div>
                <div className="mb-2 flex justify-between text-xs font-semibold text-slate-400">
                  <span>{task.status}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${status.accent}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <InlineField label="Due date">
                    {isAdmin ? (
                      <input
                        type="date"
                        value={task.dueDate || ""}
                        onChange={(e) => updateField("dueDate", e.target.value)}
                        className={mutedInput}
                      />
                    ) : (
                      <p className={readonlyText}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Sin fecha"}
                      </p>
                    )}
                  </InlineField>
                  <InlineField label="Start date">
                    {isAdmin ? (
                      <input
                        type="date"
                        value={task.startDate || ""}
                        onChange={(e) => updateField("startDate", e.target.value)}
                        className={mutedInput}
                      />
                    ) : (
                      <p className={readonlyText}>
                        {task.startDate
                          ? new Date(task.startDate).toLocaleDateString()
                          : "Sin fecha"}
                      </p>
                    )}
                  </InlineField>
                  <InlineField label="Última actualización">
                    <p className={readonlyText}>
                      {task.updatedAt ? formatTimestamp(task.updatedAt) : "Sin registro"}
                    </p>
                  </InlineField>
                  <InlineField label="Creada">
                    <p className={readonlyText}>
                      {task.createdAt ? formatTimestamp(task.createdAt) : "Sin registro"}
                    </p>
                  </InlineField>
                  <InlineField label="Esfuerzo">
                    <p className={readonlyText}>{task.effort}</p>
                  </InlineField>
                  <InlineField label="SLA">
                    <p className={readonlyText}>
                      {task.slaHours ? `${task.slaHours} horas` : "Sin definir"}
                    </p>
                    {slaCompliance && (
                      <span
                        className={`mt-1 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${slaCompliance.color}`}
                      >
                        {slaCompliance.label}
                      </span>
                    )}
                  </InlineField>
                  <InlineField label="Checklist">
                    <p className={readonlyText}>
                      {checklist.done}/{checklist.total} completado
                    </p>
                  </InlineField>
                </div>
              </section>
            </div>
          )}
        </main>

        <aside className="shrink-0 border-l border-slate-200 bg-slate-50 p-4 lg:w-72">
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Resumen</span>
                <MoreVertical className="h-4 w-4 text-slate-300" />
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Users className="h-4 w-4" />
                    Assignees
                  </span>
                  <span className="font-bold text-slate-800">{task.assignedName ? 1 : 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-500">
                    <MessageSquare className="h-4 w-4" />
                    Comments
                  </span>
                  <span className="font-bold text-slate-800">{comments.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Archive className="h-4 w-4" />
                    Archived
                  </span>
                  <span className="font-bold text-slate-800">{task.archived ? "Sí" : "No"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-500">
                    <OperationalIcon className="h-4 w-4" />
                    Decisión
                  </span>
                  <span className="font-bold text-slate-800">{operationalMeta.label}</span>
                </div>
              </div>
            </div>

            {availableStatuses.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase text-slate-400">Mover estado</h4>
                <div className="space-y-2">
                  {availableStatuses.map((s) => {
                    const M = statusMeta[s]?.icon || Circle;
                    return (
                      <button
                        key={s}
                        onClick={() => onStatus(task.id, s)}
                        className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:border-cyan-200 hover:text-cyan-700"
                      >
                        <M className="h-4 w-4" />
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h4 className="mb-2 text-xs font-bold uppercase text-slate-400">Acciones</h4>
              <div className="space-y-2">
                {[
                  [Users, "Asignar responsable", () => goToSection("task-assignees")],
                  [
                    CheckCircle2,
                    isAdmin ? "Agregar checklist" : "Ver checklist",
                    () => {
                      goToSection("task-checklist");
                      if (isAdmin)
                        window.setTimeout(
                          () => document.getElementById("new-checklist-item")?.focus(),
                          120,
                        );
                    },
                  ],
                  [Calendar, "Abrir fecha / SLA", () => setActiveTab("timing")],
                  [SlidersHorizontal, "Propiedades IT", () => goToSection("task-properties")],
                  [MessageSquare, "Abrir comentarios", () => setActiveTab("activity")],
                  [Clock3, "Abrir timing", () => setActiveTab("timing")],
                ].map(([Icon, label, action]) => (
                  <button
                    key={label}
                    onClick={action}
                    className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-600 transition-colors hover:border-cyan-200 hover:text-cyan-700"
                  >
                    <Icon className="h-4 w-4 text-slate-400" />
                    {label}
                  </button>
                ))}

                {isAdmin && (
                  <>
                    <button
                      onClick={() => onArchive(task.id, !task.archived)}
                      disabled={deletingId === task.id}
                      className="flex w-full items-center gap-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-left text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-40"
                    >
                      <Archive className="h-4 w-4" />{" "}
                      {task.archived ? "Restaurar tarea" : "Archivar tarea"}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("¿Eliminar esta tarea?")) {
                          onDelete(task.id);
                          onClose();
                        }
                      }}
                      disabled={deletingId === task.id}
                      className="flex w-full items-center gap-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" /> Eliminar tarea
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
