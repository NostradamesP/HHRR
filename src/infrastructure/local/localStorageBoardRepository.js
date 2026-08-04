import { BoardRepository } from "../../ports/BoardRepository";
import { createBoard } from "../../core/domain/entities/board";
import { LOCAL_BOARDS_KEY } from "../../core/domain/constants/storage";
import { APP_NAME } from "../../branding";
import { readLocalJSON, writeLocalJSON } from "./storage";

const LOCAL_DEMO_BOARD = {
  id: "local-demo-board",
  name: APP_NAME,
  ownerId: "local-demo-user",
  members: ["local-demo-user"],
};

export class LocalStorageBoardRepository extends BoardRepository {
  listBoards() {
    const parsed = readLocalJSON(LOCAL_BOARDS_KEY, null);
    return Array.isArray(parsed) && parsed.length ? parsed : [LOCAL_DEMO_BOARD];
  }

  subscribe(uid, onNext) {
    onNext(this.listBoards());
    return () => {};
  }

  async get(boardId) {
    return this.listBoards().find((b) => b.id === boardId) || null;
  }

  async create(board) {
    const boards = this.listBoards();
    if (boards.some((b) => b.name.toLowerCase() === String(board.name).toLowerCase())) {
      throw new Error("Ya existe un board con ese nombre");
    }
    const created = createBoard({
      ...board,
      id: board.id || `local-board-${Date.now()}`,
      createdBy: "local-demo-user",
      ownerId: "local-demo-user",
      members: board.members?.length ? board.members : ["local-demo-user"],
      createdAt: board.createdAt || new Date().toISOString(),
    });
    boards.push(created);
    writeLocalJSON(LOCAL_BOARDS_KEY, boards);
    return created;
  }

  async remove(boardId) {
    const boards = this.listBoards();
    if (boards.length <= 1) return;
    writeLocalJSON(
      LOCAL_BOARDS_KEY,
      boards.filter((b) => b.id !== boardId),
    );
  }

  async addMember(boardId, uid) {
    const boards = this.listBoards().map((b) =>
      b.id === boardId && !b.members.includes(uid) ? { ...b, members: [...b.members, uid] } : b,
    );
    writeLocalJSON(LOCAL_BOARDS_KEY, boards);
  }

  async removeMember(boardId, uid) {
    const boards = this.listBoards().map((b) =>
      b.id === boardId ? { ...b, members: b.members.filter((m) => m !== uid) } : b,
    );
    writeLocalJSON(LOCAL_BOARDS_KEY, boards);
  }
}
