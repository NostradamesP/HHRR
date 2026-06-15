import { useState, useEffect } from "react";
import { X, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useAuth } from "../../AuthContext";
import { APP_MONOGRAM, APP_NAME } from "../../branding";

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPassword("");
      setConfirmPassword("");
      setError("");
      setShowPwd(false);
      setShowConfirmPwd(false);
      setCapsOn(false);
      setShakeError(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  function getStrength(pwd) {
    if (pwd.length < 6) return "weak";
    if (pwd.length >= 8 && (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd))) return "strong";
    return "medium";
  }

  const strength = getStrength(password);
  const strengthConfig = {
    weak: { bars: 1, color: "bg-red-500", label: "Debil" },
    medium: { bars: 2, color: "bg-amber-500", label: "Media" },
    strong: { bars: 3, color: "bg-emerald-500", label: "Fuerte" },
  };

  function triggerShake() {
    setShakeError(true);
    setTimeout(() => setShakeError(false), 300);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (mode === "signup" && password !== confirmPassword) {
      setError("Las contrasenas no coinciden");
      triggerShake();
      return;
    }

    if (mode === "signup" && strength === "weak") {
      setError("La contrasena es muy debil");
      triggerShake();
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, password, name);
      }
      if (onLoginSuccess) onLoginSuccess();
    } catch (_err) {
      setError("Credenciales inv\u00e1lidas. Intenta de nuevo.");
      triggerShake();
    }
    setSubmitting(false);
  }

  async function handleReset() {
    if (!email.trim()) {
      setError("Ingresa tu correo primero");
      triggerShake();
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { sendPasswordResetEmail } = await import("firebase/auth");
      const { auth } = await import("../../firebase");
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No hay cuenta con este correo");
      } else {
        setError("Error al enviar el correo. Intenta de nuevo.");
      }
      triggerShake();
    }
    setSubmitting(false);
  }

  function handleKeyDown(e) {
    setCapsOn(e.getModifierState?.("CapsLock") || false);
  }

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className={`relative w-full max-w-sm transition-all duration-300 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="h-1 bg-gradient-to-r from-red-600 to-cyan-600" />

          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-8">
            <div className="mb-6 text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-sm font-bold text-white">
                {APP_MONOGRAM}
              </span>
              <h1 className="mt-3 text-lg font-bold text-slate-900">{APP_NAME}</h1>
              <p className="text-sm text-slate-400">
                {showReset
                  ? "Restablecer contrasena"
                  : mode === "login"
                    ? "Inicia sesion para continuar"
                    : "Crea tu cuenta"}
              </p>
            </div>

            {resetSent ? (
              <div className="text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white">
                  ✓
                </span>
                <h2 className="mt-3 text-lg font-bold text-slate-900">Correo enviado</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Revisa tu bandeja de entrada para restablecer tu contrasena.
                </p>
                <button
                  onClick={() => {
                    setResetSent(false);
                    setShowReset(false);
                    setError("");
                  }}
                  className="mt-6 text-sm text-blue-600 hover:underline font-medium"
                >
                  Volver al inicio de sesion
                </button>
              </div>
            ) : showReset ? (
              <div className="space-y-4">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Tu correo electronico"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
                />
                {error && (
                  <p className={`text-xs text-red-500 ${shakeError ? "animate-shake" : ""}`}>
                    {error}
                  </p>
                )}
                <button
                  onClick={handleReset}
                  disabled={submitting}
                  className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {submitting ? "Enviando..." : "Enviar correo de recuperacion"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReset(false);
                    setError("");
                  }}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-700"
                >
                  Volver
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
                  />
                )}
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo electronico"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
                />

                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyDown}
                    placeholder="Contrasena"
                    type={showPwd ? "text" : "password"}
                    required
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className={`w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-xs outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all ${shakeError && error ? "border-red-300" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 hover:rotate-12 transition-all"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {capsOn && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Mayusculas activada</span>
                  </div>
                )}

                {mode === "signup" && password.length > 0 && (
                  <div>
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strengthConfig[strength].bars ? strengthConfig[strength].color : "bg-slate-200"}`}
                        />
                      ))}
                    </div>
                    <p
                      className={`text-[10px] font-medium ${strength === "weak" ? "text-red-500" : strength === "medium" ? "text-amber-500" : "text-emerald-500"}`}
                    >
                      {strengthConfig[strength].label}
                    </p>
                  </div>
                )}

                {mode === "signup" && (
                  <div className="relative">
                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onKeyUp={handleKeyDown}
                      placeholder="Confirmar contrasena"
                      type={showConfirmPwd ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      className={`w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-xs outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all ${shakeError && error && password !== confirmPassword ? "border-red-300" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 hover:rotate-12 transition-all"
                    >
                      {showConfirmPwd ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}

                {error && (
                  <p className={`text-xs text-red-500 ${shakeError ? "animate-shake" : ""}`}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || (mode === "signup" && strength === "weak")}
                  className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {submitting ? "..." : mode === "login" ? "Iniciar sesion" : "Crear cuenta"}
                </button>

                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setShowReset(true)}
                    className="w-full text-center text-xs text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    Olvidaste tu contrasena?
                  </button>
                )}
              </form>
            )}

            {!showReset && !resetSent && (
              <p className="mt-4 text-center text-xs text-slate-500">
                {mode === "login" ? "No tienes cuenta? " : "Ya tienes cuenta? "}
                <button
                  type="button"
                  onClick={() => {
                    const newMode = mode === "login" ? "signup" : "login";
                    setMode(newMode);
                    setError("");
                    setPassword("");
                    setConfirmPassword("");
                    setShowPwd(false);
                    setShowConfirmPwd(false);
                  }}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {mode === "login" ? "Crear cuenta" : "Iniciar sesion"}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
