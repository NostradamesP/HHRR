import {
  collection,
  query,
  limit,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { UserRepository } from "../../ports/UserRepository";
import { db } from "../../firebase";

export class FirebaseUserRepository extends UserRepository {
  subscribe(onNext, onError) {
    return onSnapshot(
      query(collection(db, "users"), limit(200)),
      (snap) => {
        onNext(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      onError,
    );
  }

  async updateRole(uid, role) {
    await updateDoc(doc(db, "users", uid), { role });
  }

  async updateJobTitle(uid, jobTitle) {
    await updateDoc(doc(db, "users", uid), { jobTitle });
  }

  async remove(uid) {
    await deleteDoc(doc(db, "users", uid));
  }
}
