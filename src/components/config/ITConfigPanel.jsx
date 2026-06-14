import { useState } from "react";
import { Save, RefreshCw, X } from "lucide-react";

export default function ITConfigPanel({ config, onSave, onReset, onClose }) {
  const [draft, setDraft] = useState(config);

  function updateList(key, value) {
    setDraft({
      ...draft,
      [key]: value
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean),
    });
  }

  const sections = [
    ["systems", "Sistemas"],
    ["ticketTypes", "Tipos de tarea"],
    ["impacts", "Impacto"],
    ["urgencies", "Urgencia"],
    ["team", "Equipo"],
    ["jobTitles", "Puestos IT"],
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-950">Configuración IT</h2>
          <p className="text-sm text-slate-400">
            Catálogos locales para el kanban corporativo de IT.
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map(([key, label]) => (
          <label key={key} className="space-y-2">
            <span className="text-xs font-black uppercase text-slate-400">{label}</span>
            <textarea
              value={(draft[key] || []).join("\n")}
              onChange={(e) => updateList(key, e.target.value)}
              className="h-32 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-cyan-400"
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => {
            onSave(draft);
            onClose();
          }}
          className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700"
        >
          <Save className="h-4 w-4" /> Guardar configuración
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" /> Reset demo local
        </button>
      </div>
    </div>
  );
}
