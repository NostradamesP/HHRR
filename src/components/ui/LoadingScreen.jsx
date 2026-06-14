import { APP_MONOGRAM } from "../../branding";

export default function LoadingScreen({
  message = "Cargando tu kanban",
  subtitle = "Preparando tu espacio de trabajo...",
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f8f9fa]">
      <div className="text-center opacity-0-initial animate-fade-in-up">
        <div className="relative mx-auto mb-6 h-20 w-20">
          <div className="absolute inset-0 rounded-2xl bg-red-600/20 animate-pulse" />
          <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-red-600 shadow-lg">
            <span className="text-3xl font-bold text-white">{APP_MONOGRAM}</span>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">{message}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
        <div className="mt-6 flex justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-600 animate-bounce animation-delay-0" />
          <div className="h-2 w-2 rounded-full bg-red-600 animate-bounce animation-delay-200" />
          <div className="h-2 w-2 rounded-full bg-red-600 animate-bounce animation-delay-400" />
        </div>
      </div>
    </div>
  );
}
