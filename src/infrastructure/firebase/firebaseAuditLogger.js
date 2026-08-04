import { collection, addDoc, query, orderBy, getDocs } from "firebase/firestore";
import { AuditLogger } from "../../ports/AuditLogger";
import { db } from "../../firebase";

export class FirebaseAuditLogger extends AuditLogger {
  async log(entry) {
    if (!entry.boardId) return;
    await addDoc(collection(db, "boards", entry.boardId, "logs"), {
      action: entry.action,
      taskId: entry.taskId || "",
      taskTitle: entry.taskTitle || "",
      details: entry.details || "",
      userId: entry.actor || "",
      userName: entry.actorName || "",
      createdAt: entry.timestamp || new Date().toISOString(),
    });
  }

  async list(boardId) {
    if (!boardId) return [];
    const snap = await getDocs(
      query(collection(db, "boards", boardId, "logs"), orderBy("createdAt", "desc")),
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}
