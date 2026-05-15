import { createContext, useContext, useState, useEffect, useRef } from "react";
import { collection, onSnapshot, addDoc, getDocs, query, orderBy, where, serverTimestamp, deleteDoc, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";

const BoardContext = createContext(null);

export function BoardProvider({ children }) {
  const { user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardId] = useState(() => localStorage.getItem("activeBoardId"));
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (!user) {
      setBoards([]);
      setActiveBoardId(null);
      setLoading(true);
      initialized.current = false;
      return;
    }

    const unsub = onSnapshot(
      query(collection(db, "boards"), orderBy("createdAt", "asc")),
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setBoards(list);

        if (list.length > 0) {
          setActiveBoardId(prev => {
            if (prev && list.find(b => b.id === prev)) return prev;
            const saved = localStorage.getItem("activeBoardId");
            if (saved && list.find(b => b.id === saved)) return saved;
            localStorage.setItem("activeBoardId", list[0].id);
            return list[0].id;
          });
        }

        setLoading(false);
      }
    );
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user || initialized.current) return;
    initialized.current = true;

    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "boards"), where("name", "==", "NoraHR Roadmap"))
        );

        if (snap.docs.length > 1) {
          const main = snap.docs[0];
          const extras = snap.docs.slice(1);
          for (const extra of extras) {
            const [tasksSnap, logsSnap] = await Promise.all([
              getDocs(collection(db, "boards", extra.id, "tasks")),
              getDocs(collection(db, "boards", extra.id, "logs")),
            ]);
            const writes = [
              ...tasksSnap.docs.map(d =>
                setDoc(doc(db, "boards", main.id, "tasks", d.id), d.data())
              ),
              ...tasksSnap.docs.map(d =>
                deleteDoc(doc(db, "boards", extra.id, "tasks", d.id))
              ),
              ...logsSnap.docs.map(d =>
                setDoc(doc(db, "boards", main.id, "logs", d.id), d.data())
              ),
              ...logsSnap.docs.map(d =>
                deleteDoc(doc(db, "boards", extra.id, "logs", d.id))
              ),
            ];
            await Promise.allSettled(writes);
            await deleteDoc(doc(db, "boards", extra.id));
          }
          localStorage.setItem("activeBoardId", main.id);
          setActiveBoardId(main.id);
          return;
        }

        if (snap.empty) {
          const ref = await addDoc(collection(db, "boards"), {
            name: "NoraHR Roadmap",
            createdBy: user.uid,
            createdAt: serverTimestamp(),
          });
          localStorage.setItem("activeBoardId", ref.id);
          setActiveBoardId(ref.id);
        }
      } catch (e) {
        console.error("Board init error:", e);
      }
    })();
  }, [user]);

  async function createBoard(name) {
    if (!user) return null;
    const snap = await getDocs(query(collection(db, "boards"), where("name", "==", name)));
    if (!snap.empty) {
      throw new Error("Ya existe un board con ese nombre");
    }
    const ref = await addDoc(collection(db, "boards"), {
      name,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
    localStorage.setItem("activeBoardId", ref.id);
    setActiveBoardId(ref.id);
    return ref.id;
  }

  async function deleteBoard(boardId) {
    if (!user) return;
    if (boards.length <= 1) return;

    const [tasksSnap, logsSnap] = await Promise.all([
      getDocs(collection(db, "boards", boardId, "tasks")),
      getDocs(collection(db, "boards", boardId, "logs")),
    ]);
    const deletes = [
      ...tasksSnap.docs.map(d => deleteDoc(doc(db, "boards", boardId, "tasks", d.id))),
      ...logsSnap.docs.map(d => deleteDoc(doc(db, "boards", boardId, "logs", d.id))),
    ];
    await Promise.allSettled(deletes);
    await deleteDoc(doc(db, "boards", boardId));

    if (activeBoardId === boardId) {
      const remaining = boards.filter(b => b.id !== boardId);
      if (remaining.length > 0) {
        switchBoard(remaining[0].id);
      }
    }
  }

  function switchBoard(boardId) {
    localStorage.setItem("activeBoardId", boardId);
    setActiveBoardId(boardId);
  }

  return (
    <BoardContext.Provider value={{ boards, activeBoardId, switchBoard, createBoard, deleteBoard, loading }}>
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoard must be used within BoardProvider");
  return ctx;
}
