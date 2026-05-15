import { createContext, useContext, useState, useEffect, useRef } from "react";
import { collection, onSnapshot, addDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";

const BoardContext = createContext(null);

export function BoardProvider({ children }) {
  const { user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardId] = useState(() => localStorage.getItem("activeBoardId"));
  const [loading, setLoading] = useState(true);
  const autoCreated = useRef(false);

  useEffect(() => {
    if (!user) {
      setBoards([]);
      setActiveBoardId(null);
      setLoading(true);
      autoCreated.current = false;
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
    if (!user || boards.length > 0 || !loading || autoCreated.current) return;
    autoCreated.current = true;
    addDoc(collection(db, "boards"), {
      name: "NoraHR Roadmap",
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    }).then(ref => {
      localStorage.setItem("activeBoardId", ref.id);
      setActiveBoardId(ref.id);
    });
  }, [user, boards, loading]);

  async function createBoard(name) {
    if (!user) return null;
    const ref = await addDoc(collection(db, "boards"), {
      name,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
    localStorage.setItem("activeBoardId", ref.id);
    setActiveBoardId(ref.id);
    return ref.id;
  }

  function switchBoard(boardId) {
    localStorage.setItem("activeBoardId", boardId);
    setActiveBoardId(boardId);
  }

  return (
    <BoardContext.Provider value={{ boards, activeBoardId, switchBoard, createBoard, loading }}>
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoard must be used within BoardProvider");
  return ctx;
}
