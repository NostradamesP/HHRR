#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SA_PATH = join(__dirname, '..', 'service-account.json');

if (!existsSync(SA_PATH)) {
  console.error('❌ service-account.json no encontrado. Colócalo en la raíz del proyecto.');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SA_PATH, 'utf8'));

if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const serverTimestamp = FieldValue.serverTimestamp;

function parseArgs() {
  const args = {};
  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i++) {
    if (raw[i].startsWith('--')) {
      const key = raw[i].slice(2);
      if (i + 1 < raw.length && !raw[i + 1].startsWith('--')) {
        args[key] = raw[i + 1];
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

async function getDefaultUser(board) {
  if (board && board.members?.length > 0) {
    for (const uid of board.members) {
      const doc = await db.collection('users').doc(uid).get();
      if (doc.exists) {
        const u = { uid: doc.id, ...doc.data() };
        if (u.role === 'admin') return u;
      }
    }
    const doc = await db.collection('users').doc(board.members[0]).get();
    if (doc.exists) return { uid: doc.id, ...doc.data() };
  }
  // Find the admin with the most boards (most active user)
  const boardsSnap = await db.collection('boards').get();
  const boardCount = {};
  for (const doc of boardsSnap.docs) {
    const uid = doc.data().ownerId;
    boardCount[uid] = (boardCount[uid] || 0) + 1;
  }
  const sorted = Object.entries(boardCount).sort((a, b) => b[1] - a[1]);
  for (const [uid] of sorted) {
    const doc = await db.collection('users').doc(uid).get();
    if (doc.exists && doc.data().role === 'admin') {
      return { uid: doc.id, ...doc.data() };
    }
  }
  // Fallback: first admin
  const snap = await db.collection('users').where('role', '==', 'admin').limit(1).get();
  if (!snap.empty) {
    const doc = snap.docs[0];
    return { uid: doc.id, ...doc.data() };
  }
  return { uid: 'ai-assistant', name: 'Asistente IA', email: 'ai@norahr.local' };
}

async function listBoards() {
  const snap = await db.collection('boards').get();
  if (snap.empty) {
    console.log('No hay boards en Firestore.');
    return;
  }
  console.log('\nBoards disponibles:');
  for (const doc of snap.docs) {
    const d = doc.data();
    const tasksSnap = await db.collection('boards').doc(doc.id).collection('tasks').get();
    console.log(`  📋 "${d.name}" (${doc.id}) — ${tasksSnap.size} tareas, ${d.members?.length || 0} miembros`);
  }
}

async function findBoard(name) {
  const snap = await db.collection('boards').get();
  const matches = [];
  for (const doc of snap.docs) {
    if (doc.data().name === name) {
      const tasksSnap = await db.collection('boards').doc(doc.id).collection('tasks').get();
      matches.push({ id: doc.id, taskCount: tasksSnap.size, ...doc.data() });
    }
  }
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];
  // Duplicates: pick the one with the most tasks (the active one)
  matches.sort((a, b) => b.taskCount - a.taskCount);
  const chosen = matches[0];
  console.warn(`⚠️  Hay ${matches.length} boards "${name}". Usando el de mayor actividad (${chosen.id}, ${chosen.taskCount} tareas).`);
  return chosen;
}

function buildTaskData(task, user) {
  return {
    title: task.title || '(sin título)',
    description: task.description || '',
    status: task.status || 'Pendiente',
    priority: task.priority || 'Media',
    effort: task.effort || 'Medio',
    module: task.module || 'Producto',
    phase: task.phase || 'V1',
    system: task.system || '',
    ticketType: task.ticketType || task.type || '',
    requester: task.requester || user.email || '',
    impact: task.impact || 'Medio',
    urgency: task.urgency || 'Media',
    slaHours: task.slaHours ?? null,
    operationalState: task.operationalState || 'normal',
    blockedReason: task.blockedReason || '',
    dueDate: task.dueDate || null,
    assignedTo: task.assignedTo || user.uid,
    assignedName: task.assignedName || user.name || '',
    archived: task.archived ?? false,
    order: task.order ?? Date.now(),
    checklist: task.checklist ?? [],
    createdBy: task.createdBy || user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

async function createTask(boardId, taskData) {
  const ref = await db.collection('boards').doc(boardId).collection('tasks').add(taskData);

  await db.collection('boards').doc(boardId).collection('logs').add({
    taskId: ref.id,
    taskTitle: taskData.title,
    action: 'created',
    details: 'Creado desde IA',
    userId: taskData.createdBy,
    userName: 'Asistente IA',
    createdAt: serverTimestamp(),
  });

  return ref.id;
}

function loadTasksFromSource(args) {
  if (args['file']) {
    const filePath = join(process.cwd(), args['file']);
    if (!existsSync(filePath)) throw new Error(`Archivo no encontrado: ${filePath}`);
    const plan = JSON.parse(readFileSync(filePath, 'utf8'));
    return { tasks: Array.isArray(plan) ? plan : (plan.tasks || [plan]), boardName: plan.board || null };
  }
  if (args['plan']) {
    const plan = JSON.parse(args['plan']);
    return { tasks: Array.isArray(plan) ? plan : (plan.tasks || [plan]), boardName: null };
  }
  if (args['title']) {
    return { tasks: null, boardName: null };
  }
  return { tasks: null, boardName: null };
}

async function resolveBoard(boardName, resolvedUser) {
  if (!boardName) return null;
  let board = await findBoard(boardName);
  if (!board) {
    console.log(`📌 Creando nuevo board: "${boardName}"...`);
    const ref = await db.collection('boards').add({
      name: boardName,
      createdBy: resolvedUser.uid,
      ownerId: resolvedUser.uid,
      members: [resolvedUser.uid],
      createdAt: serverTimestamp(),
    });
    board = { id: ref.id, name: boardName };
    console.log(`   ✅ Board creado: ${ref.id}`);
  }
  return board;
}

async function listTasks(boardId, filter) {
  let query = db.collection('boards').doc(boardId).collection('tasks');
  if (filter?.status) query = query.where('status', '==', filter.status);
  if (filter?.module) query = query.where('module', '==', filter.module);
  if (filter?.phase) query = query.where('phase', '==', filter.phase);
  if (filter?.priority) query = query.where('priority', '==', filter.priority);
  const snap = await query.orderBy('createdAt', 'desc').limit(filter?.limit || 100).get();

  if (snap.empty) {
    console.log('   (sin tareas)');
    return;
  }

  const byPhase = {};
  snap.forEach(d => {
    const t = d.data();
    const phase = t.phase || 'Sin fase';
    if (!byPhase[phase]) byPhase[phase] = [];
    byPhase[phase].push({ id: d.id, ...t });
  });

  const phaseOrder = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8'];
  const sorted = Object.keys(byPhase).sort((a, b) => {
    const ai = phaseOrder.indexOf(a);
    const bi = phaseOrder.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  for (const phase of sorted) {
    const tasks = byPhase[phase];
    const statusCounts = {};
    tasks.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
    const summary = Object.entries(statusCounts)
      .map(([s, c]) => `${s}: ${c}`).join(', ');
    console.log(`\n  📁 ${phase} (${tasks.length} tareas — ${summary})`);
    console.log('');
    for (const t of tasks) {
      const statusIcon = t.status === 'Hecho' ? '✅' : t.status === 'En progreso' ? '🔄' : t.status === 'Bloqueado' ? '🔴' : '⚪';
      const priorityMark = t.priority === 'Alta' ? '❗' : t.priority === 'Media' ? '📌' : '🔽';
      console.log(`    ${statusIcon} [${t.id.slice(0, 6)}] ${priorityMark} ${t.title}`);
      console.log(`         Mód: ${t.module} | Prioridad: ${t.priority} | ${t.assignedName || 'Sin asignar'}`);
      if (t.description) {
        const desc = t.description.length > 100 ? t.description.slice(0, 100) + '...' : t.description;
        console.log(`         ${desc}`);
      }
      console.log('');
    }
  }
  console.log(`   ─── ${snap.size} tareas en total ───`);
}

function printUsage() {
  console.log('Uso:');
  console.log('  npm run plan -- --list-boards');
  console.log('  npm run plan -- --board "Board" --list-tasks');
  console.log('  npm run plan -- --board "Board" --list-tasks --status Pendiente');
  console.log('  npm run plan -- --board "Board" --list-tasks --module IA');
  console.log('  npm run plan -- --board "Board" --title "Tarea" [--module ...]');
  console.log('  npm run plan -- --board "Board" --plan \'{"tasks":[...]}\'');
  console.log('  npm run plan -- --file plan.json');
}

async function main() {
  const args = parseArgs();

  if (args['list-boards']) {
    await listBoards();
    return;
  }

  // Handle --list-tasks (read mode, no plan source needed)
  if (args['list-tasks']) {
    const boardName = args['board'];
    if (!boardName) {
      console.error('❌ Usa --board para especificar el board.');
      process.exit(1);
    }
    const board = await findBoard(boardName);
    if (!board) {
      console.error(`❌ Board "${boardName}" no encontrado.`);
      await listBoards();
      process.exit(1);
    }
    console.log(`\n📋 ${board.name} (${board.id})`);
    await listTasks(board.id, {
      status: args['status'] || null,
      module: args['module'] || null,
      phase: args['phase'] || null,
      priority: args['priority'] || null,
      limit: args['limit'] ? Number(args['limit']) : 100,
    });
    return;
  }

  const planSource = args['file'] || args['plan'] || (args['title'] ? 'inline' : null);
  if (!planSource) {
    printUsage();
    return;
  }

  // Load board name from source (CLI > file JSON)
  const source = loadTasksFromSource(args);
  const boardName = args['board'] || source.boardName;

  if (!boardName) {
    console.error('❌ Debes especificar --board o incluir "board" en el JSON.');
    process.exit(1);
  }

  const userPromise = args['as-user']
    ? (await db.collection('users').doc(args['as-user']).get()).then(d => d.exists ? { uid: d.id, ...d.data() } : null)
    : getDefaultUser();

  const resolvedUser = await userPromise;
  if (!resolvedUser) {
    console.error('❌ Usuario no encontrado.');
    process.exit(1);
  }

  const board = await resolveBoard(boardName, resolvedUser);

  let tasks = source.tasks;

  if (args['title']) {
    tasks = [{
      title: args['title'],
      description: args['description'] || '',
      module: args['module'] || 'Producto',
      priority: args['priority'] || 'Media',
      phase: args['phase'] || 'V1',
      status: args['status'] || 'Pendiente',
      effort: args['effort'] || 'Medio',
      dueDate: args['due-date'] || null,
      assignedTo: args['assign-to'] || resolvedUser.uid,
      assignedName: args['assign-name'] || resolvedUser.name || '',
      system: args['system'] || '',
      ticketType: args['type'] || '',
      requester: args['requester'] || '',
      impact: args['impact'] || 'Medio',
      urgency: args['urgency'] || 'Media',
      slaHours: args['sla'] ? Number(args['sla']) : null,
      operationalState: 'normal',
    }];
  }

  if (!tasks || tasks.length === 0) {
    console.error('❌ No hay tareas para crear.');
    process.exit(1);
  }

  console.log(`\n📋 Creando ${tasks.length} tarea(s) en "${board.name}"...\n`);

  for (const t of tasks) {
    const taskData = buildTaskData(t, resolvedUser);
    const taskId = await createTask(board.id, taskData);
    console.log(`   ✅ ${taskData.title}`);
    console.log(`      ID: ${taskId}`);
    console.log(`      Módulo: ${taskData.module} | Prioridad: ${taskData.priority} | Fase: ${taskData.phase}`);
    if (taskData.description) {
      const preview = taskData.description.length > 80
        ? taskData.description.slice(0, 80) + '...'
        : taskData.description;
      console.log(`      Desc: ${preview}`);
    }
    console.log('');
  }

  console.log(`✅ ${tasks.length} tarea(s) creada(s) en "${board.name}".`);
  console.log(`   Abre https://nostradamesp.github.io/HHRR/ para ver los cambios en vivo.`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
