import { taskEntity } from "../core/domain";
import { isManager, MEMBER_EDITABLE_TASK_KEYS } from "../core/domain/constants/roles";

/**
 * TaskUseCases — casos de uso de tareas. Depende solo de TaskRepository (port).
 * TaskUseCases — task use cases. Depends only on the TaskRepository port.
 *
 * @typedef {import("../ports/TaskRepository.js").TaskRepository} TaskRepository
 * @typedef {import("../ports/BoardRepository.js").BoardRepository} BoardRepository
 */
export class TaskUseCases {
  /** @param {TaskRepository} taskRepository @param {BoardRepository} boardRepository */
  constructor(taskRepository, boardRepository) {
    this.taskRepository = taskRepository;
    this.boardRepository = boardRepository;
  }

  /**
   * Sanea un patch según el actor (alineado con firestore.rules). Un miembro no operador
   * solo puede escribir las claves permitidas; si el resultado queda vacío, no escribe.
   * @param {string} boardId @param {{ uid?: string, role?: string, jobTitle?: string }} actor @param {object} patch
   * @returns {Promise<object>} patch saneado
   */
  async sanitizePatch(boardId, actor, patch) {
    if (isManager(actor)) return patch;
    const board = await this.boardRepository.get(boardId);
    if (board && actor?.uid && board.ownerId === actor.uid) return patch;
    const allowed = {};
    for (const key of Object.keys(patch)) {
      if (MEMBER_EDITABLE_TASK_KEYS.includes(key)) allowed[key] = patch[key];
    }
    return allowed;
  }

  /** @param {string} boardId @returns {Promise<import("../core/domain/entities/task.js").Task[]>} */
  listTasks(boardId) {
    return this.taskRepository.list(boardId);
  }

  /** @param {string} boardId @param {(tasks) => void} onNext @param {(err) => void} onError @returns {() => void} */
  subscribeTasks(boardId, onNext, onError) {
    return this.taskRepository.subscribe(boardId, onNext, onError);
  }

  /** @param {string} boardId @param {object} input @returns {Promise<import("../core/domain/entities/task.js").Task>} */
  async createTask(boardId, input) {
    const task = taskEntity.createTask(input);
    return this.taskRepository.create(boardId, task);
  }

  /** @param {string} boardId @param {string} taskId @param {object} patch @param {{ uid?: string, role?: string, jobTitle?: string }} [actor] @returns {Promise<void>} */
  async updateTask(boardId, taskId, patch, actor) {
    if (!patch || Object.keys(patch).length === 0) return;
    const safePatch = await this.sanitizePatch(boardId, actor, patch);
    if (!safePatch || Object.keys(safePatch).length === 0) return;
    return this.taskRepository.update(boardId, taskId, safePatch);
  }

  /** @param {string} boardId @param {string} taskId @returns {Promise<void>} */
  deleteTask(boardId, taskId) {
    return this.taskRepository.remove(boardId, taskId);
  }

  /** @param {string} boardId @param {string[]} orderedIds @returns {Promise<void>} */
  reorderTasks(boardId, orderedIds) {
    return this.taskRepository.reorder(boardId, orderedIds);
  }
}
