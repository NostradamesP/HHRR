import { isLocalMode } from "../firebase";
import {
  LocalStorageTaskRepository,
  LocalStorageBoardRepository,
  LocalStorageAuthProvider,
  LocalStorageAuditLogger,
  LocalStorageCommentRepository,
  LocalStorageMessageRepository,
  LocalStorageUserRepository,
} from "../infrastructure/local";
import {
  FirebaseTaskRepository,
  FirebaseBoardRepository,
  FirebaseAuthProvider,
  FirebaseAuditLogger,
  FirebaseCommentRepository,
  FirebaseMessageRepository,
  FirebaseUserRepository,
} from "../infrastructure/firebase";
import {
  TaskUseCases,
  BoardUseCases,
  AuthUseCases,
  AuditUseCases,
  CommentUseCases,
  MessageUseCases,
  UserUseCases,
} from "../application";

function build() {
  const useLocal = isLocalMode;
  const task = useLocal ? new LocalStorageTaskRepository() : new FirebaseTaskRepository();
  const board = useLocal ? new LocalStorageBoardRepository() : new FirebaseBoardRepository();
  const auth = useLocal ? new LocalStorageAuthProvider() : new FirebaseAuthProvider();
  const audit = useLocal ? new LocalStorageAuditLogger() : new FirebaseAuditLogger();
  const comments = useLocal ? new LocalStorageCommentRepository() : new FirebaseCommentRepository();
  const messages = useLocal ? new LocalStorageMessageRepository() : new FirebaseMessageRepository();
  const users = useLocal ? new LocalStorageUserRepository() : new FirebaseUserRepository();
  return {
    env: useLocal ? "local" : "firebase",
    taskService: new TaskUseCases(task),
    boardService: new BoardUseCases(board),
    authService: new AuthUseCases(auth),
    auditService: new AuditUseCases(audit),
    commentService: new CommentUseCases(comments),
    messageService: new MessageUseCases(messages),
    userService: new UserUseCases(users),
  };
}

let cached = null;

export function createServices() {
  if (!cached) cached = build();
  return cached;
}
