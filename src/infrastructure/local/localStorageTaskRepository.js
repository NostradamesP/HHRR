import { TaskRepository } from "../../ports/TaskRepository";
import { enrichLocalTask } from "../../core/domain/entities/task";
import { initialTasks } from "../../core/domain/constants/tasks";
import { defaultItConfig } from "../../core/domain/constants/itConfig";
import { DEFAULT_LOCAL_BOARD_ID, LOCAL_TASKS_KEY } from "../../core/domain/constants/storage";
import { readLocalJSON, writeLocalJSON, localTasksKey } from "./storage";

export class LocalStorageTaskRepository extends TaskRepository {
  constructor(config = defaultItConfig) {
    super();
    this.config = config;
  }

  list(boardId) {
    const key = localTasksKey(boardId);
    const saved = readLocalJSON(key, null);
    const legacy = boardId === DEFAULT_LOCAL_BOARD_ID ? readLocalJSON(LOCAL_TASKS_KEY, null) : null;
    const source = Array.isArray(saved) ? saved : legacy;
    const tasks =
      Array.isArray(source) && source.length
        ? source
        : boardId === DEFAULT_LOCAL_BOARD_ID
          ? initialTasks
          : [];
    return tasks.map((task, idx) => enrichLocalTask(task, idx, this.config));
  }

  subscribe(boardId, onNext) {
    onNext(this.list(boardId));
    return () => {};
  }

  async create(boardId, task) {
    const tasks = this.list(boardId);
    const created = {
      ...task,
      id: String(task.id || `local-task-${Date.now()}`),
      createdAt: task.createdAt || new Date().toISOString(),
    };
    tasks.push(created);
    writeLocalJSON(localTasksKey(boardId), tasks);
    return created;
  }

  async update(boardId, taskId, patch) {
    const tasks = this.list(boardId).map((task) =>
      task.id === taskId ? { ...task, ...patch } : task,
    );
    writeLocalJSON(localTasksKey(boardId), tasks);
  }

  async remove(boardId, taskId) {
    const tasks = this.list(boardId).filter((task) => task.id !== taskId);
    writeLocalJSON(localTasksKey(boardId), tasks);
  }

  async reorder(boardId, orderedIds) {
    const tasks = this.list(boardId);
    const orderMap = new Map(orderedIds.map((id, idx) => [String(id), idx]));
    const reordered = tasks
      .map((task) => ({ ...task, order: orderMap.get(String(task.id)) ?? task.order }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    writeLocalJSON(localTasksKey(boardId), reordered);
  }
}
