import { useState } from "react";
import { Settings } from "lucide-react";
import { updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { defaultItConfig } from "../../constants/defaultItConfig";

export default function AdminPanel({ users, currentUser, onClose, itConfig = defaultItConfig }) {
  const [updating, setUpdating] = useState({});

  async function toggleRole(uid, currentRole) {
    setUpdating((p) => ({ ...p, [uid]: true }));
    try {
      await updateDoc(doc(db, "users", uid), {
        role: currentRole === "admin" ? "member" : "admin",
      });
    } catch {
      alert("Error al cambiar rol");
    }
    setUpdating((p) => ({ ...p, [uid]: false }));
  }

  async function updateJobTitle(uid, jobTitle) {
    setUpdating((p) => ({ ...p, [uid]: true }));
    try {
      await updateDoc(doc(db, "users", uid), { jobTitle });
    } catch {
      alert("Error al actualizar puesto");
    }
    setUpdating((p) => ({ ...p, [uid]: false }));
  }

  async function removeUser(uid, email) {
    if (!confirm(`¿Eliminar a ${email} de la organización?`)) return;
    try {
      await deleteDoc(doc(db, "users", uid));
    } catch {
      alert("Error al eliminar usuario");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Settings className="h-5 w-5 text-slate-400" /> Administrar usuarios
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
          ✕
        </button>
      </div>
      <p className="text-xs text-slate-400">
        Las cuentas nuevas entran como member; desde aquí puedes asignar permisos y puestos.
      </p>
      <div className="space-y-2">
        {users.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">{u.name || u.email}</p>
              <p className="text-xs text-slate-400 truncate">{u.email}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${u.role === "admin" ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-600"}`}
              >
                {u.role}
              </span>
              <select
                value={u.jobTitle || ""}
                onChange={(e) => updateJobTitle(u.id, e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 outline-none focus:border-cyan-400"
                disabled={updating[u.id]}
              >
                <option value="">Sin puesto</option>
                {(itConfig.jobTitles || []).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              {u.id !== currentUser?.uid && (
                <>
                  <button
                    onClick={() => toggleRole(u.id, u.role)}
                    disabled={updating[u.id]}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    {u.role === "admin" ? "Hacer member" : "Hacer admin"}
                  </button>
                  <button
                    onClick={() => removeUser(u.id, u.email)}
                    className="rounded-lg border border-red-200 px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Eliminar
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
