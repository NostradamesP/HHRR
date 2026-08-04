import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { CommentRepository } from "../../ports/CommentRepository";
import { db } from "../../firebase";

export class FirebaseCommentRepository extends CommentRepository {
  subscribe(boardId, taskId, onNext, onError) {
    if (!boardId || !taskId) return () => {};
    return onSnapshot(
      query(
        collection(db, "boards", boardId, "tasks", taskId, "comments"),
        orderBy("createdAt", "asc"),
        limit(100),
      ),
      (snap) => {
        onNext(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      onError,
    );
  }

  async add(boardId, taskId, input) {
    if (!boardId || !taskId) {
      throw new Error("CommentRepository.add requires boardId and taskId");
    }
    const ref = await addDoc(collection(db, "boards", boardId, "tasks", taskId, "comments"), {
      text: input.text,
      userId: input.userId,
      userName: input.userName,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "boards", boardId, "tasks", taskId), {
      commentsCount: increment(1),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id };
  }
}
