import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { MessageRepository } from "../../ports/MessageRepository";
import { db } from "../../firebase";

export class FirebaseMessageRepository extends MessageRepository {
  subscribe(boardId, onNext, onError) {
    if (!boardId) return () => {};
    return onSnapshot(
      query(
        collection(db, "boards", boardId, "messages"),
        orderBy("createdAt", "asc"),
        limit(100),
      ),
      (snap) => {
        onNext(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      onError,
    );
  }

  async add(boardId, input) {
    if (!boardId) {
      throw new Error("MessageRepository.add requires boardId");
    }
    const ref = await addDoc(collection(db, "boards", boardId, "messages"), {
      text: input.text,
      userId: input.userId,
      userName: input.userName,
      createdAt: serverTimestamp(),
    });
    return { id: ref.id };
  }
}
