import { MessageRepository } from "../../ports/MessageRepository";
import { LOCAL_BOARD_MESSAGES_KEY } from "../../core/domain/constants/storage";
import { readLocalJSON, writeLocalJSON } from "./storage";

export class LocalStorageMessageRepository extends MessageRepository {
  subscribe(boardId, onNext) {
    const all = readLocalJSON(LOCAL_BOARD_MESSAGES_KEY, {});
    onNext(Array.isArray(all[boardId]) ? all[boardId] : []);
    return () => {};
  }

  async add(boardId, input) {
    const all = readLocalJSON(LOCAL_BOARD_MESSAGES_KEY, {});
    const message = {
      id: `local-message-${Date.now()}`,
      text: input.text,
      userId: input.userId,
      userName: input.userName,
      createdAt: new Date().toISOString(),
    };
    all[boardId] = [...(all[boardId] || []), message];
    writeLocalJSON(LOCAL_BOARD_MESSAGES_KEY, all);
    return message;
  }
}
