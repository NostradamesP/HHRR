import { useState } from "react";
import { useBoard } from "./BoardContext";
import { useAuth } from "./AuthContext";
import ChatPanel from "./ChatPanel";

const boardColors = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-indigo-500",
];

export default function Sidebar({ open, onClose }) {
  const { boards, activeBoardId, switchBoard, createBoard, deleteBoard } = useBoard();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  const filtered = boards.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    try {
      setError("");
      await createBoard(name);
      setNewName("");
    } catch (e) {
      setError(e.message);
    }
  }

  function handleDelete(boardId, e) {
    e.stopPropagation();
    if (boards.length <= 1) return;
    const board = boards.find(b => b.id === boardId);
    if (!confirm(`¿Eliminar el board "${board?.name}" y todas sus tareas?`)) return;
    deleteBoard(boardId).catch(console.error);
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <aside className={`fixed right-0 top-0 z-50 h-full w-full max-w-xs sm:max-w-sm md:w-80 bg-white border-l border-slate-200 shadow-xl transition-all duration-300 flex flex-col ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm">📋</span>
            <h2 className="text-sm font-bold text-slate-900">Boards</h2>
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{boards.length}</span>
          </div>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">✕</button>
        </div>
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-3 pb-0 shrink-0">
            <div className="relative mb-3">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar board..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-7 pr-3 py-1.5 text-xs outline-none focus:border-slate-400 focus:bg-white transition-colors"
              />
            </div>
            {isAdmin && (
              <div className="mb-3">
                <div className="flex gap-2">
                  <input
                    value={newName}
                    onChange={e => { setNewName(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleCreate()}
                    placeholder="Nuevo board..."
                    className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-slate-400 transition-colors"
                  />
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                    className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
                  >
                    + Crear
                  </button>
                </div>
                {error && <p className="mt-1 text-[10px] text-red-500">{error}</p>}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-3 space-y-1 min-h-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-300">
                <span className="text-2xl mb-2">📭</span>
                <p className="text-xs">No hay boards</p>
              </div>
            ) : (
              filtered.map((b, i) => (
                <div key={b.id} className="group relative">
                  <button
                    onClick={() => { switchBoard(b.id); onClose(); }}
                    className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-all ${
                      b.id === activeBoardId
                        ? "bg-slate-900 text-white font-semibold shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${boardColors[i % boardColors.length]} ${b.id === activeBoardId ? "ring-2 ring-white/40" : ""}`} />
                      <span className="truncate">{b.name}</span>
                    </div>
                  </button>
                  {isAdmin && boards.length > 1 && (
                    <button
                      onClick={(e) => handleDelete(b.id, e)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex h-5 w-5 items-center justify-center rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          <ChatPanel />
        </div>
      </aside>
    </>
  );
}
