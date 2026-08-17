import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { useServices } from "./presentation/context/ServicesContext";
import { APP_NAME } from "./branding";

const BoardContext = createContext(null);
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
    if (import.meta.env.DEV) console.warn("localStorage write failed:", e);
  }
}

export function BoardProvider({ children }) {
  const { user } = useAuth();
  const { boardService } = useServices();
  const isLocalDemo = !user && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardId] = useState(() => safeGetItem("activeBoardId"));
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  const boardsRef = useRef(boards);
  boardsRef.current = boards;

  useEffect(() => {
    if (isLocalDemo) {
      boardService.listBoards().then((localBoards) => {
        const fallback = localBoards.length ? localBoards : [DEFAULT_LOCAL_BOARD];
        const saved = safeGetItem("activeBoardId");
        const active = saved && fallback.find((b) => b.id === saved) ? saved : fallback[0].id;
        safeSetItem("activeBoardId", active);
        setBoards(fallback);
        setActiveBoardId(active);
        setLoading(false);
      });
      return;
    }

    if (!user) {
      setBoards([]);
      setActiveBoardId(null);
      setLoading(true);
      initialized.current = false;
      return;
    }

    let cancelled = false;

    const unsub = boardService.subscribeBoards(user.uid, (list) => {
      if (cancelled) return;
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
        boardService
          .createBoard({
            name: APP_NAME,
            createdBy: user.uid,
            ownerId: user.uid,
            members: [user.uid],
          })
          .then((board) => {
            safeSetItem("activeBoardId", board.id);
            setActiveBoardId(board.id);
          })
          .catch((e) => {
            if (import.meta.env.DEV) console.error("Error creating default board:", e);
          });
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [user, isLocalDemo, boardService]);

  function switchBoard(boardId) {
    safeSetItem("activeBoardId", boardId);
    setActiveBoardId(boardId);
  }

  async function createBoard(name) {
    if (isLocalDemo) {
      const localBoards = await boardService.listBoards();
      if (localBoards.some((b) => b.name.toLowerCase() === name.toLowerCase())) {
        throw new Error("Ya existe un board con ese nombre");
      }
      const nextBoard = await boardService.createBoard({
        name,
        createdBy: "local-demo-user",
        ownerId: "local-demo-user",
        members: ["local-demo-user"],
      });
      const nextBoards = [...localBoards, nextBoard];
      safeSetItem("activeBoardId", nextBoard.id);
      setBoards(nextBoards);
      setActiveBoardId(nextBoard.id);
      return nextBoard.id;
    }
    if (!user) return null;
    try {
      const existing = await boardService.listBoards(user.uid);
      if (existing.some((b) => b.name.toLowerCase() === name.toLowerCase())) {
        throw new Error("Ya existe un board con ese nombre");
      }
      const board = await boardService.createBoard({
        name,
        createdBy: user.uid,
        ownerId: user.uid,
        members: [user.uid],
      });
      safeSetItem("activeBoardId", board.id);
      setActiveBoardId(board.id);
      return board.id;
    } catch (e) {
      if (import.meta.env.DEV) console.error("Error creating board:", e);
      throw e;
    }
  }

  async function deleteBoard(boardId) {
    if (isLocalDemo) {
      const localBoards = await boardService.listBoards();
      if (localBoards.length <= 1) return;
      await boardService.deleteBoard(boardId);
      const nextBoards = localBoards.filter((b) => b.id !== boardId);
      setBoards(nextBoards);
      if (activeBoardId === boardId && nextBoards.length > 0) {
        switchBoard(nextBoards[0].id);
      }
      return;
    }
    if (!user) return;
    const currentBoards = boardsRef.current;
    if (currentBoards.length <= 1) return;

    try {
      await boardService.deleteBoard(boardId);

      if (activeBoardId === boardId) {
        const remaining = currentBoards.filter((b) => b.id !== boardId);
        if (remaining.length > 0) {
          switchBoard(remaining[0].id);
        }
      }
    } catch (e) {
      if (import.meta.env.DEV) console.error("Error deleting board:", e);
      throw new Error("No se pudo eliminar el board completamente");
    }
  }

  async function addMember(boardId, uid) {
    if (!user) return;
    try {
      await boardService.addMember(boardId, uid);
    } catch (e) {
      if (import.meta.env.DEV) console.error("Error adding member:", e);
      throw new Error("No se pudo agregar el miembro");
    }
  }

  async function removeMember(boardId, uid) {
    if (!user) return;
    try {
      await boardService.removeMember(boardId, uid);
    } catch (e) {
      if (import.meta.env.DEV) console.error("Error removing member:", e);
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
