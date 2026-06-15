#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SA_PATH = join(__dirname, '..', 'service-account.json');

if (!existsSync(SA_PATH)) {
  console.error('❌ service-account.json no encontrado');
  process.exit(1);
}

const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
if (getApps().length === 0) initializeApp({ credential: cert(sa) });
const db = getFirestore();
const boardId = 'DCh5Bpp75pzLxkHDxHC3';

// Map of task IDs -> new status
const updates = {
  // Sprint 2 → Hecho
  'zOS1oj': 'Hecho',
  'nwm5lv': 'Hecho',
  '0r5SGH': 'Hecho',
  '0h3TI7': 'Hecho',
  // Sprint 3 → Hecho
  'X7stlA': 'Hecho',
  'E0oBQJ': 'Hecho',
  '0ksTuu': 'Hecho',
};

async function main() {
  const snap = await db.collection('boards').doc(boardId).collection('tasks').get();
  let count = 0;
  for (const doc of snap.docs) {
    const id = doc.id.slice(0, 6);
    if (updates[id]) {
      await doc.ref.update({ status: updates[id], updatedAt: FieldValue.serverTimestamp() });
      console.log(`✅ ${id}: ${doc.data().title} → ${updates[id]}`);
      count++;
    }
  }
  console.log(`\n🎯 ${count} tareas actualizadas.`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
