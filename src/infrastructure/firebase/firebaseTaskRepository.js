import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { TaskRepository } from "../../ports/TaskRepository";
import { db } from "../../firebase";

function tasksCol(boardId) {
  return collection(db, "boards", boardId, "tasks");
}

export class FirebaseTaskRepository extends TaskRepository {
  async list(boardId) {
    const snap = await getDocs(query(tasksCol(boardId), orderBy("order", "asc")));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  subscribe(boardId, onNext, onError) {
    return onSnapshot(
      query(tasksCol(boardId), orderBy("order", "asc")),
      (snap) => {
        onNext(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      onError,
    );
  }

  async create(boardId, task) {
    const data = { ...task };
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    const ref = await addDoc(tasksCol(boardId), {
      ...data,
      createdAt: data.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { ...task, id: ref.id };
  }

  async update(boardId, taskId, patch) {
    await updateDoc(doc(db, "boards", boardId, "tasks", taskId), {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  }

  async remove(boardId, taskId) {
    await deleteDoc(doc(db, "boards", boardId, "tasks", taskId));
  }

  async reorder(boardId, orderedIds) {
    const snap = await getDocs(tasksCol(boardId));
    const batch = writeBatch(db);
    const orderMap = new Map(orderedIds.map((id, idx) => [String(id), idx]));
    snap.docs.forEach((d) => {
      const nextOrder = orderMap.get(d.id) ?? d.data().order ?? 0;
      batch.update(d.ref, { order: nextOrder });
    });
    await batch.commit();
  }
}
