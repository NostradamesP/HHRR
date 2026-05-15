import { useState } from "react";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  UserRoundCheck,
  X,
} from "lucide-react";
import { useBoard } from "./BoardContext";
import { useAuth } from "./AuthContext";
import ChatPanel from "./ChatPanel";

const boardColors = [
  { dot: "bg-blue-500", soft: "bg-blue-50" },
  { dot: "bg-emerald-500", soft: "bg-emerald-50" },
  { dot: "bg-cyan-500", soft: "bg-cyan-50" },
  { dot: "bg-amber-500", soft: "bg-amber-50" },
  { dot: "bg-rose-500", soft: "bg-rose-50" },
  { dot: "bg-cyan-500", soft: "bg-cyan-50" },
  { dot: "bg-orange-500", soft: "bg-orange-50" },
  { dot: "bg-blue-500", soft: "bg-blue-50" },
];

export default function Sidebar({ open, onClose, onQuickAction }) {
  const { boards, activeBoardId, switchBoard, createBoard, deleteBoard } = useBoard();
  const { isAdmin, user, userData } = useAuth();
  const isLocalDemo = !user && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const appIsAdmin = isAdmin || isLocalDemo;
  const appUser = user || (isLocalDemo ? { email: "demo@norahr.local" } : null);
  const appUserData = userData || (isLocalDemo ? { name: "Demo NoraHR" } : null);
  const appBoards = boards.length > 0 ? boards : (isLocalDemo ? [{ id: "local-demo-board", name: "NoraHR Roadmap" }] : boards);
  const appActiveBoardId = activeBoardId || (isLocalDemo ? "local-demo-board" : activeBoardId);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  const filtered = appBoards.filter(b =>
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
    if (appBoards.length <= 1) return;
    const board = appBoards.find(b => b.id === boardId);
    if (!confirm(`¿Eliminar el board "${board?.name}" y todas sus tareas?`)) return;
    deleteBoard(boardId).catch(console.error);
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <aside className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-xs flex-col border-l border-slate-200 bg-white shadow-2xl transition-all duration-300 sm:max-w-sm md:w-96 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="shrink-0 border-b border-slate-200 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-600 text-base font-black text-white shadow-sm">N</span>
              <div>
                <h2 className="text-sm font-black text-slate-950">NoraHR Workspace</h2>
                <p className="text-xs font-medium text-slate-400">{appBoards.length} boards activos</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {appIsAdmin && !isLocalDemo && (
            <button onClick={() => setNewName(newName || "Nuevo board")} className="mb-3 flex w-full items-center gap-3 rounded-xl bg-cyan-50 px-3 py-3 text-sm font-black text-cyan-700">
              <Plus className="h-5 w-5" />
              Create board
            </button>
          )}

          <nav className="space-y-1">
            {[
              [LayoutDashboard, "All boards", appBoards.length, "all"],
              [UserRoundCheck, "My work", "", "my-work"],
              [MessageSquare, "My comments", "", "comments"],
              [Bell, "Notifications", "", "notifications"],
            ].map(([Icon, label, badge, action]) => (
              <button key={label} onClick={() => { onQuickAction?.(action); onClose(); }} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-slate-400" />
                  {label}
                </span>
                {badge !== "" && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{badge}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 p-3 pb-0">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar board..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-cyan-300 focus:bg-white transition-colors"
              />
            </div>
            {appIsAdmin && !isLocalDemo && (
              <div className="mb-3">
                <div className="flex gap-2">
                  <input
                    value={newName}
                    onChange={e => { setNewName(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleCreate()}
                    placeholder="Nuevo board..."
                    className="h-9 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-cyan-300 transition-colors"
                  />
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                    className="flex h-9 shrink-0 items-center gap-1 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Crear
                  </button>
                </div>
                {error && <p className="mt-1 text-[10px] text-red-500">{error}</p>}
              </div>
            )}
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3">
            <div className="mb-1 flex items-center justify-between px-1">
              <span className="text-[11px] font-black uppercase text-slate-400">Boards</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            </div>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-300">
                <LayoutDashboard className="mb-2 h-8 w-8" />
                <p className="text-xs">No hay boards</p>
              </div>
            ) : (
              filtered.map((b, i) => (
                <div key={b.id} className="group relative">
                  <button
                    onClick={() => { if (!isLocalDemo) switchBoard(b.id); onClose(); }}
                    className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-all ${
                      b.id === appActiveBoardId
                        ? "bg-slate-100 text-slate-950 font-black"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${boardColors[i % boardColors.length].soft}`}>
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${boardColors[i % boardColors.length].dot}`} />
                      </span>
                      <span className="truncate">{b.name}</span>
                      {b.id === appActiveBoardId && <span className="ml-auto h-2 w-2 rounded-full bg-cyan-500" />}
                    </div>
                  </button>
                  {appIsAdmin && !isLocalDemo && appBoards.length > 1 && (
                    <button
                      onClick={(e) => handleDelete(b.id, e)}
                      className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          <ChatPanel />
          <div className="shrink-0 border-t border-slate-200 p-3">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-600 text-xs font-black text-white">{(appUserData?.name || appUser?.email || "?").charAt(0).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-800">{appUserData?.name || appUser?.email}</p>
                <p className="truncate text-xs text-slate-400">{appUser?.email}</p>
              </div>
              <CircleHelp className="h-4 w-4 text-slate-300" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
