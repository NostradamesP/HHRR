import { useState, useEffect, useRef } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { MessageSquare, Send } from "lucide-react";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import { useBoard } from "./BoardContext";

const LOCAL_BOARD_MESSAGES_KEY = "norahr.local.boardMessages";

function readLocalMessages() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_BOARD_MESSAGES_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeLocalMessages(messages) {
  localStorage.setItem(LOCAL_BOARD_MESSAGES_KEY, JSON.stringify(messages));
}

export default function ChatPanel() {
  const { user, userData } = useAuth();
  const { activeBoardId } = useBoard();
  const isLocalDemo = !user && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const chatUser =
    user || (isLocalDemo ? { uid: "local-demo-user", email: "demo@norahr.local" } : null);
  const chatUserData = userData || (isLocalDemo ? { name: "IT Manager" } : null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!activeBoardId) return;
    if (!db || isLocalDemo) {
      const all = readLocalMessages();
      setMessages(all[activeBoardId] || []);
      return;
    }
    const q = query(
      collection(db, "boards", activeBoardId, "messages"),
      orderBy("createdAt", "asc"),
      limit(100),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        if (import.meta.env.DEV) console.error("Chat messages listener error:", err);
      },
    );
    return unsub;
  }, [activeBoardId, isLocalDemo]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const cleanText = text.trim();
    if (!cleanText || !activeBoardId || !chatUser) return;
    if (!db || isLocalDemo) {
      const all = readLocalMessages();
      const nextMessage = {
        id: `local-message-${Date.now()}`,
        userId: chatUser.uid,
        userName: chatUserData?.name || chatUser.email,
        text: cleanText,
        createdAt: new Date().toISOString(),
      };
      const nextMessages = [...(all[activeBoardId] || []), nextMessage];
      writeLocalMessages({ ...all, [activeBoardId]: nextMessages });
      setMessages(nextMessages);
      setText("");
      return;
    }
    try {
      await addDoc(collection(db, "boards", activeBoardId, "messages"), {
        userId: chatUser.uid,
        userName: chatUserData?.name || chatUser.email,
        text: cleanText,
        createdAt: serverTimestamp(),
      });
      setText("");
    } catch (err) {
      if (import.meta.env.DEV) console.error("Error sending message:", err);
    }
  }

  function formatTime(ts) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex min-h-0 flex-col border-t border-slate-200 bg-white">
      <div className="flex shrink-0 items-center justify-between px-3 py-2">
        <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
          <MessageSquare className="h-3.5 w-3.5 text-cyan-500" />
          Chat del board
        </h3>
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
          {messages.length}
        </span>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3" style={{ maxHeight: "190px" }}>
        {messages.map((m) => (
          <div key={m.id} className="rounded-xl bg-slate-50 px-3 py-2 text-xs">
            <div className="flex items-baseline gap-1.5">
              <span className="max-w-[140px] truncate font-bold text-slate-700">{m.userName}</span>
              <span className="text-[10px] text-slate-400 shrink-0">{formatTime(m.createdAt)}</span>
            </div>
            <p className="text-slate-600 break-words leading-relaxed">{m.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="flex shrink-0 gap-1.5 border-t border-slate-100 p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] outline-none transition-colors focus:border-cyan-300 focus:bg-white"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white transition-colors hover:bg-cyan-700 disabled:bg-slate-200"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
