import { useState } from "react";
import { X } from "lucide-react";
import { modules, phaseMap } from "../../constants/meta";
import { defaultItConfig } from "../../constants/defaultItConfig";
import { makeChecklist } from "../../lib/utils";
import { sanitizeText } from "../../lib/utils";
import { useAuth } from "../../AuthContext";

export default function TaskForm({
  onSave,
  onClose,
  initial,
  users,
  itConfig = defaultItConfig,
  isLocal = false,
}) {
  const { isAdmin } = useAuth();
  const [f, setF] = useState(
    initial || {
      title: "",
      module: modules[0],
      phase: "V1",
      priority: "Media",
      effort: "Medio",
      description: "",
      assignedTo: "",
      assignedName: "",
      startDate: "",
      dueDate: "",
      ticketType: itConfig.ticketTypes[0] || "",
      requester: "Operaciones IT",
      system: itConfig.systems[0] || "",
      impact: "Medio",
      urgency: "Media",
      slaHours: 72,
      checklist: makeChecklist("Nueva tarea"),
    },
  );
  const [newCheckItem, setNewCheckItem] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addCheckItem() {
    const text = newCheckItem.trim();
    if (!text) return;
    setF({
      ...f,
      checklist: [...(f.checklist || []), { id: `check-${Date.now()}`, text, done: false }],
    });
    setNewCheckItem("");
  }

  function updateChecklistItem(id, patch) {
    setF({
      ...f,
      checklist: (f.checklist || []).map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  }

  function removeChecklistItem(id) {
    setF({ ...f, checklist: (f.checklist || []).filter((item) => item.id !== id) });
  }

  async function handleSave() {
    if (!f.title.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      await onSave({ ...f, title: sanitizeText(f.title), description: sanitizeText(f.description || ""), requester: sanitizeText(f.requester || ""), id: initial?.id });
    } catch (err) {
      if (import.meta.env.DEV) console.error("Task save failed:", err);
      setError(err?.message || "No se pudo guardar la tarea. Revisa permisos o el board activo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">
        {initial ? "Editar tarea" : "Nueva tarea"}
      </h2>
      <input
        placeholder="Título"
        value={f.title}
        onChange={(e) => setF({ ...f, title: e.target.value })}
        maxLength={200}
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-slate-900 transition-colors"
        autoFocus
      />
      <textarea
        placeholder="Descripción (opcional)"
        value={f.description || ""}
        onChange={(e) => setF({ ...f, description: e.target.value })}
        maxLength={5000}
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-slate-900 transition-colors"
        rows={2}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select
          value={f.module}
          onChange={(e) => setF({ ...f, module: e.target.value })}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-slate-900"
        >
          {modules.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={f.phase}
          onChange={(e) => setF({ ...f, phase: e.target.value })}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-slate-900"
        >
          {Object.entries(phaseMap).map(([k, v]) => (
            <option key={k} value={k}>
              {k} - {v}
            </option>
          ))}
        </select>
        <select
          value={f.priority}
          onChange={(e) => setF({ ...f, priority: e.target.value })}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-slate-900"
        >
          <option value="Alta">Alta</option>
          <option value="Media">Media</option>
          <option value="Baja">Baja</option>
        </select>
        <select
          value={f.effort}
          onChange={(e) => setF({ ...f, effort: e.target.value })}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-slate-900"
        >
          <option value="Alto">Alto</option>
          <option value="Medio">Medio</option>
          <option value="Bajo">Bajo</option>
        </select>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          value={f.startDate || ""}
          onChange={(e) => setF({ ...f, startDate: e.target.value })}
          type="date"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-slate-900 transition-colors"
        />
        <input
          value={f.dueDate || ""}
          onChange={(e) => setF({ ...f, dueDate: e.target.value })}
          type="date"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-slate-900 transition-colors"
        />
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
        <h3 className="text-xs font-black uppercase text-slate-400">Campos IT</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={f.system || ""}
            onChange={(e) => setF({ ...f, system: e.target.value })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-cyan-400"
          >
            {itConfig.systems.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={f.ticketType || ""}
            onChange={(e) => setF({ ...f, ticketType: e.target.value })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-cyan-400"
          >
            {itConfig.ticketTypes.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <input
            value={f.requester || ""}
            onChange={(e) => setF({ ...f, requester: e.target.value })}
            placeholder="Solicitante"
            maxLength={100}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-cyan-400"
          />
          <input
            value={f.slaHours || ""}
            onChange={(e) => setF({ ...f, slaHours: Number(e.target.value) || "" })}
            type="number"
            min="1"
            placeholder="SLA horas"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-cyan-400"
          />
          {isLocal && (
            <select
              value={f.assignedName || ""}
              onChange={(e) =>
                setF({
                  ...f,
                  assignedTo: e.target.value ? `local-${e.target.value}` : "",
                  assignedName: e.target.value,
                })
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-cyan-400"
            >
              <option value="">Sin asignar</option>
              {itConfig.team.map((v) => (
                <option key={v} value={v}>
                  Asignar: {v}
                </option>
              ))}
            </select>
          )}
          <select
            value={f.impact || ""}
            onChange={(e) => setF({ ...f, impact: e.target.value })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-cyan-400"
          >
            {itConfig.impacts.map((v) => (
              <option key={v} value={v}>
                Impacto: {v}
              </option>
            ))}
          </select>
          <select
            value={f.urgency || ""}
            onChange={(e) => setF({ ...f, urgency: e.target.value })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-cyan-400"
          >
            {itConfig.urgencies.map((v) => (
              <option key={v} value={v}>
                Urgencia: {v}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase text-slate-400">Checklist</h4>
          {(f.checklist || []).map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!item.done}
                onChange={(e) => updateChecklistItem(item.id, { done: e.target.checked })}
              />
              <input
                value={item.text}
                onChange={(e) => updateChecklistItem(item.id, { text: e.target.value })}
                maxLength={200}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => removeChecklistItem(item.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={newCheckItem}
              onChange={(e) => setNewCheckItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCheckItem();
                }
              }}
              placeholder="Agregar item de checklist"
              maxLength={200}
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-cyan-400"
            />
            <button
              type="button"
              onClick={addCheckItem}
              className="rounded-lg bg-cyan-600 px-3 text-xs font-bold text-white"
            >
              Agregar
            </button>
          </div>
        </div>
      </div>
      {isAdmin && users.length > 0 && (
        <select
          value={f.assignedTo}
          onChange={(e) => {
            const u = users.find((u) => u.id === e.target.value);
            setF({ ...f, assignedTo: e.target.value, assignedName: u ? u.name : "" });
          }}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-slate-900"
        >
          <option value="">Sin asignar</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={!f.title.trim() || saving}
          className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
        >
          {saving ? "Guardando..." : initial ? "Actualizar" : "Agregar"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
