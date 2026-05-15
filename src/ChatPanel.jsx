import { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, addDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import { useBoard } from "./BoardContext";

export default function ChatPanel() {
  const { user, userData } = useAuth();
  const { activeBoardId } = useBoard();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!activeBoardId) return;
    const q = query(
      collection(db, "boards", activeBoardId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [activeBoardId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || !activeBoardId) return;
    await addDoc(collection(db, "boards", activeBoardId, "messages"), {
      userId: user.uid,
      userName: userData?.name || user.email,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
    setText("");
  }

  function formatTime(ts) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="border-t border-slate-200 flex flex-col" style={{ minHeight: 0 }}>
      <div className="flex items-center justify-between px-3 py-2 shrink-0">
        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Chat del board</h3>
        <span className="text-[10px] text-slate-400">{messages.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 space-y-2 min-h-0" style={{ maxHeight: "180px" }}>
        {messages.map(m => (
          <div key={m.id} className="text-xs">
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-slate-700 truncate max-w-[100px]">{m.userName}</span>
              <span className="text-[10px] text-slate-400 shrink-0">{formatTime(m.createdAt)}</span>
            </div>
            <p className="text-slate-600 break-words leading-relaxed">{m.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-1.5 border-t border-slate-100 p-2 shrink-0">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] outline-none focus:border-slate-400 focus:bg-white transition-colors"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
        >
          →
        </button>
      </form>
    </div>
  );
}
