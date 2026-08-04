/* eslint-disable no-unused-vars */

/**
 * CommentRepository — interface (port) para comentarios de tareas.
 * CommentRepository — interface (port) for task comments.
 *
 * Implementaciones concretas: src/infrastructure/firebase/…, src/infrastructure/local/…
 */

export class CommentRepository {
  /**
   * @param {string|null} boardId
   * @param {string} taskId
   * @param {(comments: object[]) => void} onNext
   * @param {(err: Error) => void} [onError]
   * @returns {() => void} unsubscribe
   */
  subscribe(boardId, taskId, onNext, onError) {
    throw new Error("CommentRepository.subscribe not implemented");
  }

  /**
   * @param {string|null} boardId
   * @param {string} taskId
   * @param {{ text: string, userId: string, userName: string }} input
   * @returns {Promise<object>} created comment
   */
  async add(boardId, taskId, input) {
    throw new Error("CommentRepository.add not implemented");
  }
}
