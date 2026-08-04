import { isLocalMode } from "../firebase";
import {
  LocalStorageTaskRepository,
  LocalStorageBoardRepository,
  LocalStorageAuthProvider,
  LocalStorageAuditLogger,
} from "../infrastructure/local";
import {
  FirebaseTaskRepository,
  FirebaseBoardRepository,
  FirebaseAuthProvider,
  FirebaseAuditLogger,
} from "../infrastructure/firebase";
import { TaskUseCases, BoardUseCases, AuthUseCases, AuditUseCases } from "../application";

function build() {
  const useLocal = isLocalMode;
  const task = useLocal ? new LocalStorageTaskRepository() : new FirebaseTaskRepository();
  const board = useLocal ? new LocalStorageBoardRepository() : new FirebaseBoardRepository();
  const auth = useLocal ? new LocalStorageAuthProvider() : new FirebaseAuthProvider();
  const audit = useLocal ? new LocalStorageAuditLogger() : new FirebaseAuditLogger();
  return {
    env: useLocal ? "local" : "firebase",
    taskService: new TaskUseCases(task),
    boardService: new BoardUseCases(board),
    authService: new AuthUseCases(auth),
    auditService: new AuditUseCases(audit),
  };
}

let cached = null;

export function createServices() {
  if (!cached) cached = build();
  return cached;
}
