import { CommentRepository } from "../../ports/CommentRepository";
import { LOCAL_COMMENTS_KEY } from "../../core/domain/constants/storage";
import { readLocalJSON, writeLocalJSON } from "./storage";

export class LocalStorageCommentRepository extends CommentRepository {
  subscribe(boardId, taskId, onNext) {
    const all = readLocalJSON(LOCAL_COMMENTS_KEY, {});
    onNext(Array.isArray(all[taskId]) ? all[taskId] : []);
    return () => {};
  }

  async add(boardId, taskId, input) {
    const all = readLocalJSON(LOCAL_COMMENTS_KEY, {});
    const comment = {
      id: `local-comment-${Date.now()}`,
      text: input.text,
      userId: input.userId,
      userName: input.userName,
      createdAt: new Date().toISOString(),
    };
    all[taskId] = [...(all[taskId] || []), comment];
    writeLocalJSON(LOCAL_COMMENTS_KEY, all);
    return comment;
  }
}
