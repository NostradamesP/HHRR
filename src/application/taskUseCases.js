import { taskEntity } from "../core/domain";

/**
 * TaskUseCases — casos de uso de tareas. Depende solo de TaskRepository (port).
 * TaskUseCases — task use cases. Depends only on the TaskRepository port.
 *
 * @typedef {import("../ports/TaskRepository.js").TaskRepository} TaskRepository
 */
export class TaskUseCases {
  /** @param {TaskRepository} taskRepository */
  constructor(taskRepository) {
    this.taskRepository = taskRepository;
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

  /** @param {string} boardId @param {string} taskId @param {object} patch @returns {Promise<void>} */
  updateTask(boardId, taskId, patch) {
    return this.taskRepository.update(boardId, taskId, patch);
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
