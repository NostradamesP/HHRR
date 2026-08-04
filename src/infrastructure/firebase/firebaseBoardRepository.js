import {
  collection,
  onSnapshot,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { BoardRepository } from "../../ports/BoardRepository";
import { db } from "../../firebase";

const SUBCOLLECTIONS = ["tasks", "logs", "messages"];

async function deleteSubcollection(boardId, subcol) {
  try {
    const snap = await getDocs(collection(db, "boards", boardId, subcol));
    if (snap.empty) return;
    await Promise.allSettled(
      snap.docs.map((d) => deleteDoc(doc(db, "boards", boardId, subcol, d.id))),
    );
  } catch (e) {
    console.warn(`Error cleaning ${subcol} for board ${boardId}:`, e);
  }
}

export class FirebaseBoardRepository extends BoardRepository {
  async listBoards(uid) {
    const snap = await getDocs(
      query(collection(db, "boards"), where("members", "array-contains", uid)),
    );
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt?.toMillis?.() || new Date(b.createdAt || 0).getTime();
        return aTime - bTime;
      });
  }

  subscribe(uid, onNext) {
    return onSnapshot(
      query(collection(db, "boards"), where("members", "array-contains", uid)),
      (snap) => {
        onNext(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() || new Date(a.createdAt || 0).getTime();
              const bTime = b.createdAt?.toMillis?.() || new Date(b.createdAt || 0).getTime();
              return aTime - bTime;
            }),
        );
      },
    );
  }

  async create(board) {
    const data = { ...board };
    delete data.id;
    delete data.createdAt;
    const ref = await addDoc(collection(db, "boards"), {
      ...data,
      createdAt: data.createdAt || serverTimestamp(),
    });
    return { ...board, id: ref.id };
  }

  async remove(boardId) {
    await Promise.all(SUBCOLLECTIONS.map((subcol) => deleteSubcollection(boardId, subcol)));
    await deleteDoc(doc(db, "boards", boardId));
  }

  async addMember(boardId, uid) {
    await updateDoc(doc(db, "boards", boardId), { members: arrayUnion(uid) });
  }

  async removeMember(boardId, uid) {
    await updateDoc(doc(db, "boards", boardId), { members: arrayRemove(uid) });
  }
}
