import React, { useMemo, useState } from "react";

const initialTasks = [
  { id: 1, phase: "V1 - Fundación", module: "Producto", title: "Definir visión del producto", description: "Documento corto explicando qué es NoraHR, para quién es y qué problema resuelve mejor que SPN.", priority: "Alta", status: "Pendiente", sprint: "Sprint 0", owner: "Eduardo", effort: "Medio" },
  { id: 2, phase: "V1 - Fundación", module: "Arquitectura", title: "Elegir stack definitivo", description: "Confirmar Flutter + NestJS/FastAPI + PostgreSQL + Docker + storage privado.", priority: "Alta", status: "Pendiente", sprint: "Sprint 0", owner: "Eduardo", effort: "Medio" },
  { id: 3, phase: "V1 - Fundación", module: "Seguridad", title: "Definir modelo de permisos", description: "Crear roles: Super Admin, Empresa Admin, RRHH, Supervisor, Empleado, Nómina y Auditor.", priority: "Alta", status: "Pendiente", sprint: "Sprint 0", owner: "Eduardo", effort: "Alto" },
  { id: 4, phase: "V1 - Fundación", module: "Infraestructura", title: "Crear monorepo inicial", description: "Estructura apps/mobile, apps/admin, backend, docs e infra.", priority: "Alta", status: "Pendiente", sprint: "Sprint 1", owner: "Eduardo", effort: "Bajo" },
  { id: 5, phase: "V1 - Fundación", module: "Diseño", title: "Crear prototipo Figma", description: "Diseñar login, dashboard empleado, solicitudes, documentos, empleados y panel RRHH.", priority: "Alta", status: "Pendiente", sprint: "Sprint 1", owner: "Eduardo", effort: "Alto" },
  { id: 6, phase: "V2 - Auth y empresas", module: "Auth", title: "Login seguro", description: "Implementar login con access token corto, refresh token rotativo y cierre de sesión.", priority: "Alta", status: "Pendiente", sprint: "Sprint 2", owner: "Eduardo", effort: "Alto" },
  { id: 7, phase: "V2 - Auth y empresas", module: "Auth", title: "MFA para administradores", description: "Agregar segundo factor para RRHH, Empresa Admin y Super Admin.", priority: "Alta", status: "Pendiente", sprint: "Sprint 2", owner: "Eduardo", effort: "Medio" },
  { id: 8, phase: "V2 - Auth y empresas", module: "Empresas", title: "Multi-tenant por company_id", description: "Todas las tablas sensibles deben separar datos por empresa desde el backend.", priority: "Alta", status: "Pendiente", sprint: "Sprint 2", owner: "Eduardo", effort: "Alto" },
  { id: 9, phase: "V2 - Auth y empresas", module: "Auditoría", title: "Audit logs base", description: "Registrar login, cambios de permisos, creación de usuarios y acciones críticas.", priority: "Alta", status: "Pendiente", sprint: "Sprint 2", owner: "Eduardo", effort: "Medio" },
  { id: 10, phase: "V3 - RRHH Self-Service", module: "Empleados", title: "CRUD de empleados", description: "Crear, editar, activar/desactivar empleados, departamentos, posiciones y datos básicos.", priority: "Alta", status: "Pendiente", sprint: "Sprint 3", owner: "Eduardo", effort: "Alto" },
  { id: 11, phase: "V3 - RRHH Self-Service", module: "Flutter", title: "Dashboard de empleado", description: "Pantalla con perfil, solicitudes, documentos, notificaciones y próximos eventos.", priority: "Alta", status: "Pendiente", sprint: "Sprint 3", owner: "Eduardo", effort: "Medio" },
  { id: 12, phase: "V3 - RRHH Self-Service", module: "Solicitudes", title: "Solicitudes de vacaciones", description: "Empleado solicita vacaciones, supervisor aprueba/rechaza y RRHH puede auditar.", priority: "Alta", status: "Pendiente", sprint: "Sprint 4", owner: "Eduardo", effort: "Alto" },
  { id: 13, phase: "V3 - RRHH Self-Service", module: "Solicitudes", title: "Licencias y permisos", description: "Flujo para licencia médica, permiso personal, ausencia y cambio de datos.", priority: "Media", status: "Pendiente", sprint: "Sprint 4", owner: "Eduardo", effort: "Alto" },
  { id: 14, phase: "V4 - Documentos", module: "Documentos", title: "Storage privado de documentos", description: "Subir documentos con permisos, URLs firmadas, expiración y logs de descarga.", priority: "Alta", status: "Pendiente", sprint: "Sprint 5", owner: "Eduardo", effort: "Alto" },
  { id: 15, phase: "V4 - Documentos", module: "Documentos", title: "Generador de cartas laborales", description: "Plantillas PDF para carta laboral, certificación salarial y constancia de empleo.", priority: "Media", status: "Pendiente", sprint: "Sprint 5", owner: "Eduardo", effort: "Medio" },
  { id: 16, phase: "V5 - Dashboard Admin", module: "Reportes", title: "Dashboard RRHH", description: "Mostrar empleados activos, solicitudes pendientes, ausencias, documentos y actividad reciente.", priority: "Alta", status: "Pendiente", sprint: "Sprint 6", owner: "Eduardo", effort: "Alto" },
  { id: 17, phase: "V5 - Dashboard Admin", module: "Notificaciones", title: "Notificaciones push/email", description: "Enviar alertas para aprobaciones, documentos, cambios de estado y tareas pendientes.", priority: "Media", status: "Pendiente", sprint: "Sprint 6", owner: "Eduardo", effort: "Medio" },
  { id: 18, phase: "V6 - Payroll Lite", module: "Nómina", title: "Períodos de nómina", description: "Crear períodos, asignar empleados, ingresos, deducciones y cálculo neto inicial.", priority: "Media", status: "Pendiente", sprint: "Sprint 7", owner: "Eduardo", effort: "Alto" },
  { id: 19, phase: "V6 - Payroll Lite", module: "Nómina", title: "Recibos de pago PDF", description: "Generar recibo de pago consultable desde app empleado y auditable por RRHH.", priority: "Media", status: "Pendiente", sprint: "Sprint 7", owner: "Eduardo", effort: "Medio" },
  { id: 20, phase: "V7 - Cumplimiento RD", module: "Compliance RD", title: "Research TSS/DGII/DGT", description: "Documentar cálculos, reportes, formatos y responsabilidades legales en República Dominicana.", priority: "Alta", status: "Pendiente", sprint: "Sprint 8", owner: "Eduardo", effort: "Alto" },
  { id: 21, phase: "V8 - BI + IA", module: "BI", title: "Métricas de ausentismo y headcount", description: "Crear gráficos por departamento, mes, tipo de ausencia y tendencia de empleados.", priority: "Baja", status: "Pendiente", sprint: "Sprint 9", owner: "Eduardo", effort: "Medio" },
  { id: 22, phase: "V8 - BI + IA", module: "IA", title: "Asistente de RRHH futuro", description: "Explorar IA para resumir solicitudes, generar cartas y detectar patrones de ausencias.", priority: "Baja", status: "Pendiente", sprint: "Sprint 10", owner: "Eduardo", effort: "Alto" },
];

const statusOptions = ["Pendiente", "En progreso", "Bloqueado", "Hecho"];
const priorityOptions = ["Todas", "Alta", "Media", "Baja"];
const viewOptions = ["Etapas", "Kanban", "Seguridad", "Tests"];
const phaseIcons = { "V1 - Fundación": "🚀", "V2 - Auth y empresas": "🔐", "V3 - RRHH Self-Service": "👥", "V4 - Documentos": "📄", "V5 - Dashboard Admin": "📊", "V6 - Payroll Lite": "💳", "V7 - Cumplimiento RD": "🛡️", "V8 - BI + IA": "🤖" };

function getUniqueValues(items, key) { return Array.from(new Set(items.map((item) => item[key]))); }

function filterTasks(tasks, query, selectedPhase, selectedModule, selectedPriority) {
  const cleanQuery = query.trim().toLowerCase();
  return tasks.filter((task) => {
    const searchableText = [task.title, task.description, task.module, task.phase, task.status, task.priority].join(" ").toLowerCase();
    return (cleanQuery === "" || searchableText.includes(cleanQuery)) && (selectedPhase === "Todas" || task.phase === selectedPhase) && (selectedModule === "Todos" || task.module === selectedModule) && (selectedPriority === "Todas" || task.priority === selectedPriority);
  });
}

function groupBy(items, key) {
  return items.reduce((groups, item) => {
    const groupKey = item[key];
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(item);
    return groups;
  }, {});
}

function calculateProgress(tasks) {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((task) => task.status === "Hecho").length / tasks.length) * 100);
}

function runSelfTests() {
  const sampleTasks = [
    { id: 1, title: "Login seguro", description: "JWT", module: "Auth", phase: "V1", priority: "Alta", status: "Pendiente" },
    { id: 2, title: "Dashboard", description: "RRHH", module: "Reportes", phase: "V2", priority: "Media", status: "Hecho" },
    { id: 3, title: "MFA", description: "Admins", module: "Auth", phase: "V1", priority: "Alta", status: "Hecho" },
  ];
  return [
    { name: "Filtra por búsqueda", pass: filterTasks(sampleTasks, "login", "Todas", "Todos", "Todas").length === 1 },
    { name: "Filtra por módulo", pass: filterTasks(sampleTasks, "", "Todas", "Auth", "Todas").length === 2 },
    { name: "Filtra por prioridad", pass: filterTasks(sampleTasks, "", "Todas", "Todos", "Alta").length === 2 },
    { name: "Agrupa por fase", pass: Object.keys(groupBy(sampleTasks, "phase")).length === 2 },
    { name: "Calcula progreso correctamente", pass: calculateProgress(sampleTasks) === 67 },
    { name: "No rompe con lista vacía", pass: calculateProgress([]) === 0 },
  ];
}

function getPriorityStyle(priority) { return priority === "Alta" ? "border-red-200 bg-red-50 text-red-700" : priority === "Media" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-100 text-slate-700"; }
function getStatusStyle(status) { if (status === "Hecho") return "border-emerald-200 bg-emerald-50 text-emerald-700"; if (status === "En progreso") return "border-blue-200 bg-blue-50 text-blue-700"; if (status === "Bloqueado") return "border-rose-200 bg-rose-50 text-rose-700"; return "border-slate-200 bg-slate-100 text-slate-700"; }
function getStatusIcon(status) { if (status === "Hecho") return "✅"; if (status === "En progreso") return "⏳"; if (status === "Bloqueado") return "⚠️"; return "○"; }

function Badge({ children, className = "" }) { return <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>{children}</span>; }
function Card({ children, className = "" }) { return <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>; }
function ProgressBar({ value }) { return <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-slate-950 transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>; }
function StatCard({ icon, label, value }) { return <Card className="p-5"><div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-xl">{icon}</div><div><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold text-slate-950">{value}</p></div></div></Card>; }

function TaskCard({ task, onStatusChange, compact = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex flex-wrap gap-2">
        <Badge className={getPriorityStyle(task.priority)}>{task.priority}</Badge>
        <Badge className={getStatusStyle(task.status)}>{getStatusIcon(task.status)} {task.status}</Badge>
        {!compact && <Badge className="border-slate-200 bg-slate-50 text-slate-600">{task.sprint}</Badge>}
      </div>
      <h3 className="font-bold leading-snug text-slate-950">{task.title}</h3>
      {!compact && <p className="mt-2 text-sm leading-6 text-slate-600">{task.description}</p>}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
        <div><span className="font-semibold text-slate-700">Módulo:</span> {task.module}</div>
        <div><span className="font-semibold text-slate-700">Esfuerzo:</span> {task.effort || "N/A"}</div>
        {!compact && <div><span className="font-semibold text-slate-700">Owner:</span> {task.owner || "N/A"}</div>}
        {!compact && <div><span className="font-semibold text-slate-700">Sprint:</span> {task.sprint || "N/A"}</div>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {statusOptions.map((status) => (
          <button key={status} type="button" onClick={() => onStatusChange(task.id, status)} className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${task.status === status ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>{status}</button>
        ))}
      </div>
    </div>
  );
}

export default function NoraHRRoadmap() {
  const [tasks, setTasks] = useState(initialTasks);
  const [query, setQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("Todas");
  const [selectedModule, setSelectedModule] = useState("Todos");
  const [selectedPhase, setSelectedPhase] = useState("Todas");
  const [activeView, setActiveView] = useState("Etapas");
  const phases = useMemo(() => ["Todas", ...getUniqueValues(tasks, "phase")], [tasks]);
  const modules = useMemo(() => ["Todos", ...getUniqueValues(tasks, "module")], [tasks]);
  const filteredTasks = useMemo(() => filterTasks(tasks, query, selectedPhase, selectedModule, selectedPriority), [tasks, query, selectedPhase, selectedModule, selectedPriority]);
  const groupedByPhase = useMemo(() => groupBy(filteredTasks, "phase"), [filteredTasks]);
  const tests = useMemo(() => runSelfTests(), []);
  const doneCount = tasks.filter((task) => task.status === "Hecho").length;
  const inProgressCount = tasks.filter((task) => task.status === "En progreso").length;
  const blockedCount = tasks.filter((task) => task.status === "Bloqueado").length;
  const progress = calculateProgress(tasks);
  const updateStatus = (id, nextStatus) => { setTasks((currentTasks) => currentTasks.map((task) => (task.id === id ? { ...task, status: nextStatus } : task))); };
  const resetFilters = () => { setQuery(""); setSelectedPriority("Todas"); setSelectedModule("Todos"); setSelectedPhase("Todas"); };

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-950 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-300">📱 Flutter-first · ☁️ Cloud-first · 🔐 Security-first</div>
              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Roadmap Interactivo NoraHR</h1>
              <p className="text-base leading-7 text-slate-300 md:text-lg">Plan por etapas para construir una plataforma moderna de RRHH, autoservicio, documentos, solicitudes, nómina ligera, cumplimiento RD y BI.</p>
            </div>
            <div className="w-full rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur md:w-80">
              <div className="text-sm text-slate-300">Progreso general</div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-4xl font-bold">{progress}%</span>
                <span className="pb-1 text-sm text-slate-300">{doneCount}/{tasks.length} tareas</span>
              </div>
              <div className="mt-3"><div className="h-2 w-full overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-all duration-300" style={{ width: `${progress}%` }} /></div></div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard icon="🗂️" label="Total tareas" value={tasks.length} />
          <StatCard icon="⏳" label="En progreso" value={inProgressCount} />
          <StatCard icon="⚠️" label="Bloqueadas" value={blockedCount} />
          <StatCard icon="✅" label="Hechas" value={doneCount} />
        </section>

        <Card className="p-5">
          <div className="grid gap-3 md:grid-cols-5">
            <input type="search" placeholder="Buscar tarea, módulo o etapa..." value={query} onChange={(event) => setQuery(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 md:col-span-2" />
            <select value={selectedPhase} onChange={(event) => setSelectedPhase(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950">{phases.map((phase) => <option key={phase} value={phase}>{phase}</option>)}</select>
            <select value={selectedModule} onChange={(event) => setSelectedModule(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950">{modules.map((module) => <option key={module} value={module}>{module}</option>)}</select>
            <select value={selectedPriority} onChange={(event) => setSelectedPriority(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950">{priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">Mostrando {filteredTasks.length} de {tasks.length} tareas.</p>
            <button type="button" onClick={resetFilters} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Limpiar filtros</button>
          </div>
        </Card>

        <nav className="flex flex-wrap gap-2 rounded-3xl bg-slate-200 p-2 md:w-fit">
          {viewOptions.map((view) => (
            <button key={view} type="button" onClick={() => setActiveView(view)} className={`rounded-2xl px-5 py-2 text-sm font-semibold transition ${activeView === view ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:bg-white/60"}`}>{view}</button>
          ))}
        </nav>

        {activeView === "Etapas" && (
          <section className="space-y-5">
            {Object.entries(groupedByPhase).map(([phase, phaseTasks]) => {
              const phaseProgress = calculateProgress(phaseTasks);
              const phaseDone = phaseTasks.filter((task) => task.status === "Hecho").length;
              return (
                <Card key={phase} className="p-5 md:p-6">
                  <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-xl text-white">{phaseIcons[phase] || "🚀"}</div>
                      <div><h2 className="text-xl font-bold">{phase}</h2><p className="text-sm text-slate-500">{phaseDone}/{phaseTasks.length} completadas</p></div>
                    </div>
                    <div className="w-full md:w-72">
                      <div className="mb-1 flex justify-between text-xs text-slate-500"><span>Progreso</span><span>{phaseProgress}%</span></div>
                      <ProgressBar value={phaseProgress} />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{phaseTasks.map((task) => <TaskCard key={task.id} task={task} onStatusChange={updateStatus} />)}</div>
                </Card>
              );
            })}
          </section>
        )}

        {activeView === "Kanban" && (
          <section className="grid gap-4 md:grid-cols-4">
            {statusOptions.map((status) => {
              const statusTasks = filteredTasks.filter((task) => task.status === status);
              return (
                <Card key={status} className="p-4">
                  <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">{getStatusIcon(status)} {status}</h2><Badge className="border-slate-200 bg-slate-50 text-slate-600">{statusTasks.length}</Badge></div>
                  <div className="space-y-3">
                    {statusTasks.map((task) => <TaskCard key={task.id} task={task} onStatusChange={updateStatus} compact />)}
                    {statusTasks.length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">No hay tareas aquí.</div>}
                  </div>
                </Card>
              );
            })}
          </section>
        )}

        {activeView === "Seguridad" && (
          <section className="grid gap-4 md:grid-cols-3">
            {[{ title: "Backend primero", icon: "🔐", items: ["Permisos validados en API", "JWT corto + refresh token", "MFA para admins", "Rate limiting"] }, { title: "Datos sensibles", icon: "🛡️", items: ["Storage privado", "URLs firmadas", "Cifrado en tránsito", "Backups cifrados"] }, { title: "Auditoría", icon: "📄", items: ["Cambios de salario", "Descargas", "Aprobaciones", "Cambios de permisos"] }].map((section) => (
              <Card key={section.title} className="p-6">
                <div className="mb-4 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-xl text-white">{section.icon}</div><h3 className="text-lg font-bold">{section.title}</h3></div>
                <div className="space-y-2">{section.items.map((item) => <div key={item} className="flex items-center gap-2 rounded-2xl bg-slate-100 p-3 text-sm text-slate-700">✅ {item}</div>)}</div>
              </Card>
            ))}
          </section>
        )}

        {activeView === "Tests" && (
          <Card className="p-6">
            <div className="mb-5"><h2 className="text-xl font-bold">Pruebas internas del roadmap</h2><p className="mt-1 text-sm text-slate-500">Estas pruebas validan las funciones puras de filtrado, agrupación y progreso.</p></div>
            <div className="space-y-3">
              {tests.map((test) => (
                <div key={test.name} className={`flex items-center justify-between rounded-2xl border p-4 ${test.pass ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
                  <span className="font-semibold text-slate-800">{test.name}</span>
                  <Badge className={test.pass ? "border-emerald-200 bg-white text-emerald-700" : "border-rose-200 bg-white text-rose-700"}>{test.pass ? "PASS" : "FAIL"}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}