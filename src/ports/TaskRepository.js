/* eslint-disable no-unused-vars */

/**
 * TaskRepository — interface (port) para el repositorio de tareas.
 * TaskRepository — interface (port) for the task repository.
 *
 * Implementaciones concretas: src/infrastructure/firebase/…, src/infrastructure/local/…
 *
 * @typedef {Object} TaskPatch
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [phase]
 * @property {string} [module]
 * @property {string} [priority]
 * @property {string} [status]
 * @property {string} [effort]
 * @property {number} [order]
 * @property {string} [startDate]
 * @property {string} [dueDate]
 * @property {boolean} [archived]
 * @property {string} [assignedTo]
 * @property {string} [assignedName]
 * @property {string} [ticketType]
 * @property {string} [requester]
 * @property {string} [system]
 * @property {string} [impact]
 * @property {string} [urgency]
 * @property {number} [slaHours]
 * @property {Array} [checklist]
 * @property {string} [operationalState]
 * @property {string} [blockedReason]
 */

export class TaskRepository {
  /**
   * @param {string} boardId
   * @returns {Promise<import("../core/domain/entities/task.js").Task[]>}
   */
  async list(boardId) {
    throw new Error("TaskRepository.list not implemented");
  }

  /**
   * @param {string} boardId
   * @param {(tasks: import("../core/domain/entities/task.js").Task[]) => void} onNext
   * @returns {() => void} unsubscribe
   */
  subscribe(boardId, onNext) {
    throw new Error("TaskRepository.subscribe not implemented");
  }

  /**
   * @param {string} boardId
   * @param {import("../core/domain/entities/task.js").Task} task
   * @returns {Promise<import("../core/domain/entities/task.js").Task>}
   */
  async create(boardId, task) {
    throw new Error("TaskRepository.create not implemented");
  }

  /**
   * @param {string} boardId
   * @param {string} taskId
   * @param {TaskPatch} patch
   * @returns {Promise<void>}
   */
  async update(boardId, taskId, patch) {
    throw new Error("TaskRepository.update not implemented");
  }

  /**
   * @param {string} boardId
   * @param {string} taskId
   * @returns {Promise<void>}
   */
  async remove(boardId, taskId) {
    throw new Error("TaskRepository.remove not implemented");
  }

  /**
   * @param {string} boardId
   * @param {string[]} orderedIds
   * @returns {Promise<void>}
   */
  async reorder(boardId, orderedIds) {
    throw new Error("TaskRepository.reorder not implemented");
  }
}
