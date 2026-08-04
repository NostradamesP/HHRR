import { useState, useEffect } from "react";
import {
  User,
  KanbanSquare,
  BarChart3,
  FileText,
  Users,
  ShieldCheck,
  Database,
  BadgeCheck,
  ListChecks,
  MousePointerClick,
  LineChart,
} from "lucide-react";
import { APP_MONOGRAM, APP_NAME } from "../../branding";

const MOCK_COLUMNS = [
  {
    name: "Pendiente",
    dot: "bg-slate-400",
    cards: [
      { title: "Migrar servidores a la nube", tag: "Infraestructura", tagClass: "bg-cyan-50 text-cyan-700", effort: "L", due: "Vie 12" },
      { title: "Revisar licencias de software", tag: "Soporte", tagClass: "bg-amber-50 text-amber-700", effort: "S", due: "Lun 15" },
    ],
  },
  {
    name: "En progreso",
    dot: "bg-cyan-500",
    cards: [
      { title: "Automatizar backups diarios", tag: "Infraestructura", tagClass: "bg-cyan-50 text-cyan-700", effort: "M", due: "Hoy" },
      { title: "Auditoria de seguridad", tag: "Seguridad", tagClass: "bg-red-50 text-red-700", effort: "L", due: "Mie 17" },
    ],
  },
  {
    name: "Bloqueado",
    dot: "bg-amber-500",
    cards: [
      { title: "Migrar CRM a nuevo proveedor", tag: "Sistemas", tagClass: "bg-indigo-50 text-indigo-700", effort: "XL", due: "—" },
    ],
  },
  {
    name: "Hecho",
    dot: "bg-emerald-500",
    cards: [
      { title: "Actualizar politica de passwords", tag: "Seguridad", tagClass: "bg-red-50 text-red-700", effort: "S", due: "Jue 11" },
      { title: "Onboarding nuevo equipo", tag: "RRHH", tagClass: "bg-emerald-50 text-emerald-700", effort: "M", due: "Lun 8" },
    ],
  },
];

const HOW_STEPS = [
  {
    icon: ListChecks,
    title: "Crea tu cuenta",
    desc: "Registrate con tu correo y entra a tu tablero de IT en segundos.",
  },
  {
    icon: MousePointerClick,
    title: "Organiza tus tareas",
    desc: "Crea tareas, asignalas y arrastralas entre columnas con drag & drop.",
  },
  {
    icon: LineChart,
    title: "Mide y decide",
    desc: "Dashboard, reportes y SLA para decidir con datos reales.",
  },
];

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: "Roles y permisos",
    desc: "Administradores, managers y miembros con control granular.",
  },
  {
    icon: Database,
    title: "Datos seguros en Firebase",
    desc: "Autenticacion y reglas de acceso por rol en tiempo real.",
  },
  {
    icon: BadgeCheck,
    title: "Listo para tu equipo",
    desc: "Crea tu tablero y colabora sin costos de configuracion.",
  },
];

export default function LandingPage({ onOpenLogin }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fa] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="currentColor" className="text-slate-900" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <nav
        className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200" : "bg-transparent"}`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3 opacity-0-initial animate-fade-in-down">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-sm font-bold text-white shadow-sm">
                {APP_MONOGRAM}
              </span>
              <span className="text-lg font-bold text-slate-900">{APP_NAME}</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 opacity-0-initial animate-fade-in-down animation-delay-100">
              <a href="#features" className="hover:text-slate-900 transition-colors">
                Funcionalidades
              </a>
              <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
                Como funciona
              </a>
            </div>
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 opacity-0-initial animate-fade-in-down animation-delay-100"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Iniciar sesion</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight opacity-0-initial animate-fade-in-up animation-delay-200">
                Gestiona tu departamento de IT con <span className="text-red-600">claridad</span>
              </h1>
              <p className="mt-6 text-lg text-slate-500 max-w-md opacity-0-initial animate-fade-in-up animation-delay-300">
                Organiza tareas, visualiza el progreso de tu equipo y toma decisiones con datos
                reales. Todo en un solo lugar.
              </p>
              <div className="mt-8 flex flex-wrap gap-4 opacity-0-initial animate-fade-in-up animation-delay-400">
                <button
                  onClick={onOpenLogin}
                  className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-600/20"
                >
                  Comenzar ahora
                </button>
                <a
                  href="#features"
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Ver funcionalidades
                </a>
              </div>
            </div>

            <div className="relative opacity-0-initial animate-fade-in-left animation-delay-300">
              <div className="animate-float">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-400" />
                      <div className="h-3 w-3 rounded-full bg-amber-400" />
                      <div className="h-3 w-3 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex-1 h-6 rounded-lg bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {MOCK_COLUMNS.map((status) => (
                      <div key={status.name} className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                          <span className="text-[10px] font-semibold text-slate-600">
                            {status.name}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {status.cards.map((card) => (
                            <div
                              key={card.title}
                              className="rounded-lg border border-slate-100 bg-slate-50 p-2"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className="flex-1 truncate text-[10px] font-semibold text-slate-700 leading-tight">
                                  {card.title}
                                </span>
                                <span
                                  className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold ${card.tagClass}`}
                                >
                                  {card.tag}
                                </span>
                              </div>
                              <div className="mt-1.5 flex items-center justify-between">
                                <span className="rounded bg-white px-1 text-[8px] font-medium text-slate-500">
                                  {card.effort}
                                </span>
                                <span className="text-[8px] font-medium text-slate-400">
                                  {card.due}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-white py-24 border-t border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900">Todo lo que necesitas</h2>
              <p className="mt-3 text-slate-500">
                Herramientas disenadas para equipos de IT modernos
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: KanbanSquare,
                  title: "Tablero Kanban",
                  desc: "Arrastra tareas entre columnas con drag & drop intuitivo",
                  color: "text-cyan-600",
                  bg: "bg-cyan-50",
                },
                {
                  icon: BarChart3,
                  title: "Dashboard",
                  desc: "Metricas en tiempo real: tareas vencidas, en progreso y completadas",
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  icon: FileText,
                  title: "Reportes",
                  desc: "Exporta reportes detallados en PDF o CSV para stakeholders",
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                },
                {
                  icon: Users,
                  title: "Colaboracion",
                  desc: "Trabaja con tu equipo en tiempo real con roles y permisos",
                  color: "text-red-600",
                  bg: "bg-red-50",
                },
              ].map((feature, i) => (
                <div
                  key={feature.title}
                  className={`group rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 opacity-0-initial animate-fade-in-up animation-delay-${(i + 3) * 100}`}
                >
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} ${feature.color} group-hover:rotate-12 transition-transform duration-300`}
                  >
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900">Empieza en minutos</h2>
              <p className="mt-3 text-slate-500">
                Tres pasos para poner tu departamento en orden
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-10">
              {HOW_STEPS.map((step, i) => (
                <div key={step.title} className="relative text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
                    <step.icon className="h-8 w-8" />
                  </div>
                  <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                    0{i + 1}
                  </span>
                  <h3 className="mt-6 text-lg font-bold text-slate-900">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-900 py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-10">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-red-400">
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-white py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-xs font-bold text-white">
                  {APP_MONOGRAM}
                </span>
                <span className="text-sm font-bold text-slate-900">{APP_NAME}</span>
              </div>
              <nav className="flex items-center gap-6 text-sm text-slate-500">
                <a href="#features" className="hover:text-slate-900 transition-colors">
                  Funcionalidades
                </a>
                <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
                  Como funciona
                </a>
                <button
                  onClick={onOpenLogin}
                  className="hover:text-slate-900 transition-colors font-medium"
                >
                  Iniciar sesion
                </button>
              </nav>
              <p className="text-sm text-slate-400">
                {APP_NAME} &copy; {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
