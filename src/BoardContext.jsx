import { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import { APP_NAME } from "./branding";

const BoardContext = createContext(null);
const LOCAL_BOARDS_KEY = "norahr.local.boards";
const DEFAULT_LOCAL_BOARD = {
  id: "local-demo-board",
  name: APP_NAME,
  ownerId: "local-demo-user",
  members: ["local-demo-user"],
};

function safeGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn("localStorage write failed:", e);
  }
}

function readLocalBoards() {
  try {
    const parsed = JSON.parse(safeGetItem(LOCAL_BOARDS_KEY) || "[]");
    return Array.isArray(parsed) && parsed.length ? parsed : [DEFAULT_LOCAL_BOARD];
  } catch {
    return [DEFAULT_LOCAL_BOARD];
  }
}

function writeLocalBoards(boards) {
  safeSetItem(LOCAL_BOARDS_KEY, JSON.stringify(boards));
}

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

export function BoardProvider({ children }) {
  const { user } = useAuth();
  const isLocalDemo = !user && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardId] = useState(() => safeGetItem("activeBoardId"));
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  const boardsRef = useRef(boards);
  boardsRef.current = boards;

  useEffect(() => {
    if (isLocalDemo) {
      const localBoards = readLocalBoards();
      const saved = safeGetItem("activeBoardId");
      const active = saved && localBoards.find((b) => b.id === saved) ? saved : localBoards[0].id;
      safeSetItem("activeBoardId", active);
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

    const unsub = onSnapshot(
      query(collection(db, "boards"), where("members", "array-contains", user.uid)),
      (snap) => {
        if (cancelled) return;
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || new Date(a.createdAt || 0).getTime();
            const bTime = b.createdAt?.toMillis?.() || new Date(b.createdAt || 0).getTime();
            return aTime - bTime;
          });
        setBoards(list);

        if (list.length > 0) {
          setActiveBoardId((prev) => {
            if (prev && list.find((b) => b.id === prev)) return prev;
            const saved = safeGetItem("activeBoardId");
            if (saved && list.find((b) => b.id === saved)) return saved;
            safeSetItem("activeBoardId", list[0].id);
            return list[0].id;
          });
        } else if (!initialized.current) {
          initialized.current = true;
          addDoc(collection(db, "boards"), {
            name: APP_NAME,
            createdBy: user.uid,
            ownerId: user.uid,
            members: [user.uid],
            createdAt: serverTimestamp(),
          })
            .then((ref) => {
              safeSetItem("activeBoardId", ref.id);
              setActiveBoardId(ref.id);
            })
            .catch((e) => {
              console.error("Error creating default board:", e);
            });
        }

        setLoading(false);
      },
      (err) => {
        console.error("Boards listener error:", err);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
      unsub();
    };
  }, [user, isLocalDemo]);

  function switchBoard(boardId) {
    safeSetItem("activeBoardId", boardId);
    setActiveBoardId(boardId);
  }

  async function createBoard(name) {
    if (isLocalDemo) {
      const localBoards = readLocalBoards();
      if (localBoards.some((b) => b.name.toLowerCase() === name.toLowerCase())) {
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
      safeSetItem("activeBoardId", nextBoard.id);
      setBoards(nextBoards);
      setActiveBoardId(nextBoard.id);
      return nextBoard.id;
    }
    if (!user) return null;
    try {
      const snap = await getDocs(
        query(
          collection(db, "boards"),
          where("createdBy", "==", user.uid),
          where("name", "==", name),
        ),
      );
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
      safeSetItem("activeBoardId", ref.id);
      setActiveBoardId(ref.id);
      return ref.id;
    } catch (e) {
      console.error("Error creating board:", e);
      throw e;
    }
  }

  async function deleteBoard(boardId) {
    if (isLocalDemo) {
      const localBoards = readLocalBoards();
      if (localBoards.length <= 1) return;
      const nextBoards = localBoards.filter((b) => b.id !== boardId);
      writeLocalBoards(nextBoards);
      setBoards(nextBoards);
      if (activeBoardId === boardId) {
        const remaining = nextBoards;
        if (remaining.length > 0) {
          switchBoard(remaining[0].id);
        }
      }
      return;
    }
    if (!user) return;
    const currentBoards = boardsRef.current;
    if (currentBoards.length <= 1) return;

    try {
      await Promise.all([
        deleteSubcollection(boardId, "tasks"),
        deleteSubcollection(boardId, "logs"),
        deleteSubcollection(boardId, "messages"),
      ]);
      await deleteDoc(doc(db, "boards", boardId));

      if (activeBoardId === boardId) {
        const remaining = currentBoards.filter((b) => b.id !== boardId);
        if (remaining.length > 0) {
          switchBoard(remaining[0].id);
        }
      }
    } catch (e) {
      console.error("Error deleting board:", e);
      throw new Error("No se pudo eliminar el board completamente");
    }
  }

  async function addMember(boardId, uid) {
    if (!user) return;
    try {
      await updateDoc(doc(db, "boards", boardId), {
        members: arrayUnion(uid),
      });
    } catch (e) {
      console.error("Error adding member:", e);
      throw new Error("No se pudo agregar el miembro");
    }
  }

  async function removeMember(boardId, uid) {
    if (!user) return;
    try {
      await updateDoc(doc(db, "boards", boardId), {
        members: arrayRemove(uid),
      });
    } catch (e) {
      console.error("Error removing member:", e);
      throw new Error("No se pudo eliminar el miembro");
    }
  }

  return (
    <BoardContext.Provider
      value={{
        boards,
        activeBoardId,
        switchBoard,
        createBoard,
        deleteBoard,
        addMember,
        removeMember,
        loading,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoard must be used within BoardProvider");
  return ctx;
}
