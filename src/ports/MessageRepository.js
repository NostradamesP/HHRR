/* eslint-disable no-unused-vars */

/**
 * MessageRepository — interface (port) para mensajes del chat del board.
 * MessageRepository — interface (port) for board chat messages.
 *
 * Implementaciones concretas: src/infrastructure/firebase/…, src/infrastructure/local/…
 */

export class MessageRepository {
  /**
   * @param {string|null} boardId
   * @param {(messages: object[]) => void} onNext
   * @param {(err: Error) => void} [onError]
   * @returns {() => void} unsubscribe
   */
  subscribe(boardId, onNext, onError) {
    throw new Error("MessageRepository.subscribe not implemented");
  }

  /**
   * @param {string|null} boardId
   * @param {{ text: string, userId: string, userName: string }} input
   * @returns {Promise<object>} created message
   */
  async add(boardId, input) {
    throw new Error("MessageRepository.add not implemented");
  }
}
