/* eslint-disable no-unused-vars */

/**
 * BoardRepository — interface (port) para el repositorio de boards.
 * BoardRepository — interface (port) for the board repository.
 *
 * Implementaciones concretas: src/infrastructure/firebase/…, src/infrastructure/local/…
 */

export class BoardRepository {
  /**
   * @param {string} uid
   * @returns {Promise<import("../core/domain/entities/board.js").Board[]>}
   */
  async listBoards(uid) {
    throw new Error("BoardRepository.listBoards not implemented");
  }

  /**
   * @param {string} uid
   * @param {(boards: import("../core/domain/entities/board.js").Board[]) => void} onNext
   * @returns {() => void} unsubscribe
   */
  subscribe(uid, onNext) {
    throw new Error("BoardRepository.subscribe not implemented");
  }

  /**
   * @param {string} boardId
   * @returns {Promise<import("../core/domain/entities/board.js").Board|null>}
   */
  async get(boardId) {
    throw new Error("BoardRepository.get not implemented");
  }

  /**
   * @param {import("../core/domain/entities/board.js").Board} board
   * @returns {Promise<import("../core/domain/entities/board.js").Board>}
   */
  async create(board) {
    throw new Error("BoardRepository.create not implemented");
  }

  /**
   * @param {string} boardId
   * @returns {Promise<void>}
   */
  async remove(boardId) {
    throw new Error("BoardRepository.remove not implemented");
  }

  /**
   * @param {string} boardId
   * @param {string} uid
   * @returns {Promise<void>}
   */
  async addMember(boardId, uid) {
    throw new Error("BoardRepository.addMember not implemented");
  }

  /**
   * @param {string} boardId
   * @param {string} uid
   * @returns {Promise<void>}
   */
  async removeMember(boardId, uid) {
    throw new Error("BoardRepository.removeMember not implemented");
  }
}
