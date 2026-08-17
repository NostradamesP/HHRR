import { useState, useEffect, useRef } from "react";
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
  const emailRef = useRef(null);
  const dialogRef = useRef(null);

  const LOGIN_ERRORS = {
    "auth/invalid-email": "El correo no tiene un formato valido.",
    "auth/user-disabled": "Esta cuenta fue deshabilitada.",
    "auth/user-not-found": "No hay una cuenta con este correo.",
    "auth/wrong-password": "La contrasena es incorrecta.",
    "auth/invalid-credential": "Credenciales invalidas. Verifica correo y contrasena.",
    "auth/too-many-requests": "Demasiados intentos. Espera un momento e intenta de nuevo.",
    "auth/network-request-failed": "Problema de conexion. Revisa tu internet.",
  };
  const SIGNUP_ERRORS = {
    "auth/email-already-in-use": "Este correo ya esta registrado. Inicia sesion.",
    "auth/weak-password": "La contrasena es muy debil (minimo 6 caracteres).",
    "auth/invalid-email": "El correo no tiene un formato valido.",
    "auth/operation-not-allowed": "El registro no esta habilitado.",
    "auth/network-request-failed": "Problema de conexion. Revisa tu internet.",
  };
  const RESET_ERRORS = {
    "auth/user-not-found": "No hay una cuenta con este correo.",
    "auth/invalid-email": "El correo no tiene un formato valido.",
    "auth/too-many-requests": "Demasiados intentos. Espera un momento e intenta de nuevo.",
    "auth/network-request-failed": "Problema de conexion. Revisa tu internet.",
  };

  function errorMessage(code, mode) {
    const map = mode === "signup" ? SIGNUP_ERRORS : mode === "reset" ? RESET_ERRORS : LOGIN_ERRORS;
    return map[code] || "Credenciales invalidas. Intenta de nuevo.";
  }

  useEffect(() => {
    if (!isOpen) return;
    const prevFocus = document.activeElement;
    const timer = setTimeout(() => {
      if (mode === "signup") {
        dialogRef.current?.querySelector('input[name="name"]')?.focus();
      } else if (!showReset) {
        emailRef.current?.focus();
      }
    }, 60);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
      if (prevFocus && typeof prevFocus.focus === "function") prevFocus.focus();
    };
  }, [isOpen, mode, showReset]);

  useEffect(() => {
    if (!isOpen) return;
    const handleTab = (e) => {
      if (e.key !== "Tab") return;
      const nodes = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [isOpen]);

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
    } catch (err) {
      setError(errorMessage(err?.code, mode));
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
      setError(errorMessage(err?.code, "reset"));
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
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
          className="overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
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
              <h1 id="login-modal-title" className="mt-3 text-lg font-bold text-slate-900">
                {APP_NAME}
              </h1>
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
                  name="email"
                  inputMode="email"
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {submitting && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
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
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={100}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
                  />
                )}
                <input
                  ref={emailRef}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo electronico"
                  type="email"
                  name="email"
                  inputMode="email"
                  required
                  maxLength={254}
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
                    name="password"
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
                      name="confirmPassword"
                      autoComplete="new-password"
                      type={showConfirmPwd ? "text" : "password"}
                      required
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {submitting && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {submitting
                    ? mode === "login"
                      ? "Verificando..."
                      : "Creando cuenta..."
                    : mode === "login"
                      ? "Iniciar sesion"
                      : "Crear cuenta"}
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
