import { createContext, useContext, useState, useEffect, useRef } from "react";
import { collection, onSnapshot, addDoc, getDocs, query, where, serverTimestamp, deleteDoc, doc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";

const BoardContext = createContext(null);
const LOCAL_BOARDS_KEY = "norahr.local.boards";
const DEFAULT_LOCAL_BOARD = { id: "local-demo-board", name: "NoraHR Roadmap", ownerId: "local-demo-user", members: ["local-demo-user"] };

function readLocalBoards() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_BOARDS_KEY) || "[]");
    return Array.isArray(parsed) && parsed.length ? parsed : [DEFAULT_LOCAL_BOARD];
  } catch {
    return [DEFAULT_LOCAL_BOARD];
  }
}

function writeLocalBoards(boards) {
  localStorage.setItem(LOCAL_BOARDS_KEY, JSON.stringify(boards));
}

export function BoardProvider({ children }) {
  const { user } = useAuth();
  const isLocalDemo = !user && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardId] = useState(() => localStorage.getItem("activeBoardId"));
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (isLocalDemo) {
      const localBoards = readLocalBoards();
      const saved = localStorage.getItem("activeBoardId");
      const active = saved && localBoards.find(b => b.id === saved) ? saved : localBoards[0].id;
      localStorage.setItem("activeBoardId", active);
      setBoards(localBoards);
      setActiveBoardId(active);
      setLoading(false);
      initialized.current = false;
      return;
    }

    if (!user || !db) {
      setBoards([]);
      setActiveBoardId(null);
      setLoading(true);
      initialized.current = false;
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [createdSnap, ownedSnap] = await Promise.all([
          getDocs(query(collection(db, "boards"), where("createdBy", "==", user.uid))),
          getDocs(query(collection(db, "boards"), where("ownerId", "==", user.uid))),
        ]);
        const legacy = new Map();
        [...createdSnap.docs, ...ownedSnap.docs].forEach(d => legacy.set(d.id, { id: d.id, ...d.data() }));
        await Promise.allSettled([...legacy.values()].map(b => {
          if (Array.isArray(b.members) && b.members.includes(user.uid) && b.ownerId) return Promise.resolve();
          return updateDoc(doc(db, "boards", b.id), {
            members: arrayUnion(user.uid),
            ownerId: b.ownerId || b.createdBy || user.uid,
          });
        }));
      } catch (e) {
        console.error("Board membership repair error:", e);
      }
    })();

    const unsub = onSnapshot(
      query(collection(db, "boards"), where("members", "array-contains", user.uid)),
      (snap) => {
        if (cancelled) return;
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || new Date(a.createdAt || 0).getTime();
            const bTime = b.createdAt?.toMillis?.() || new Date(b.createdAt || 0).getTime();
            return aTime - bTime;
          });
        setBoards(list);

        // migration: add members + ownerId to legacy boards
        list.forEach(b => {
          if (!b.members && b.createdBy) {
            updateDoc(doc(db, "boards", b.id), { members: [b.createdBy], ownerId: b.createdBy }).catch(console.error);
          }
        });

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
      },
      (err) => {
        console.error("Boards listener error:", err);
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
      unsub();
    };
  }, [user, isLocalDemo]);

  useEffect(() => {
    if (isLocalDemo || !user || !db || initialized.current) return;
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
            ownerId: user.uid,
            members: [user.uid],
            createdAt: serverTimestamp(),
          });
          localStorage.setItem("activeBoardId", ref.id);
          setActiveBoardId(ref.id);
        }
      } catch (e) {
        console.error("Board init error:", e);
      }
    })();
  }, [user, isLocalDemo]);

  async function createBoard(name) {
    if (isLocalDemo) {
      const localBoards = readLocalBoards();
      if (localBoards.some(b => b.name.toLowerCase() === name.toLowerCase())) {
        throw new Error("Ya existe un board con ese nombre");
      }
      const nextBoard = {
        id: `local-board-${Date.now()}`,
        name,
        createdBy: "local-demo-user",
        ownerId: "local-demo-user",
        members: ["local-demo-user"],
        createdAt: new Date().toISOString(),
      };
      const nextBoards = [...localBoards, nextBoard];
      writeLocalBoards(nextBoards);
      localStorage.setItem("activeBoardId", nextBoard.id);
      setBoards(nextBoards);
      setActiveBoardId(nextBoard.id);
      return nextBoard.id;
    }
    if (!user) return null;
    const snap = await getDocs(query(collection(db, "boards"), where("name", "==", name)));
    if (!snap.empty) {
      throw new Error("Ya existe un board con ese nombre");
    }
    const ref = await addDoc(collection(db, "boards"), {
      name,
      createdBy: user.uid,
      ownerId: user.uid,
      members: [user.uid],
      createdAt: serverTimestamp(),
    });
    localStorage.setItem("activeBoardId", ref.id);
    setActiveBoardId(ref.id);
    return ref.id;
  }

  async function deleteBoard(boardId) {
    if (isLocalDemo) {
      const localBoards = readLocalBoards();
      if (localBoards.length <= 1) return;
      const nextBoards = localBoards.filter(b => b.id !== boardId);
      writeLocalBoards(nextBoards);
      setBoards(nextBoards);
      if (activeBoardId === boardId) {
        switchBoard(nextBoards[0].id);
      }
      return;
    }
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

  async function addMember(boardId, uid) {
    if (!user) return;
    await updateDoc(doc(db, "boards", boardId), {
      members: arrayUnion(uid),
    });
  }

  async function removeMember(boardId, uid) {
    if (!user) return;
    await updateDoc(doc(db, "boards", boardId), {
      members: arrayRemove(uid),
    });
  }

  return (
    <BoardContext.Provider value={{ boards, activeBoardId, switchBoard, createBoard, deleteBoard, addMember, removeMember, loading }}>
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoard must be used within BoardProvider");
  return ctx;
}
