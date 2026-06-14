import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function ToastNotification({ toast, onClose }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!toast) return;
    setExiting(false);
    const t = setTimeout(() => {
      setExiting(true);
      setTimeout(onClose, 300);
    }, 4000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const type = toast.type || "error";
  const colors = {
    error: {
      border: "border-red-200",
      bg: "bg-red-50",
      icon: "bg-red-500",
      text: "text-red-800",
      dot: "bg-red-500",
    },
    success: {
      border: "border-emerald-200",
      bg: "bg-emerald-50",
      icon: "bg-emerald-500",
      text: "text-emerald-800",
      dot: "bg-emerald-500",
    },
    info: {
      border: "border-blue-200",
      bg: "bg-blue-50",
      icon: "bg-blue-500",
      text: "text-blue-800",
      dot: "bg-blue-500",
    },
  };
  const c = colors[type] || colors.error;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] max-w-sm transition-all duration-300 ${exiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0 animate-in slide-in-from-right-4 fade-in duration-300"}`}
    >
      <div className={`rounded-xl border ${c.border} ${c.bg} px-4 py-3 shadow-xl`}>
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${c.dot}`} />
          <span className={`text-sm font-semibold leading-snug ${c.text}`}>{toast.message}</span>
          <button
            onClick={() => {
              setExiting(true);
              setTimeout(onClose, 300);
            }}
            className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
