import { boardEntity } from "../core/domain";

/**
 * BoardUseCases — casos de uso de boards. Depende solo de BoardRepository (port).
 * BoardUseCases — board use cases. Depends only on the BoardRepository port.
 *
 * @typedef {import("../ports/BoardRepository.js").BoardRepository} BoardRepository
 */
export class BoardUseCases {
  /** @param {BoardRepository} boardRepository */
  constructor(boardRepository) {
    this.boardRepository = boardRepository;
  }

  /** @param {string} uid @returns {Promise<import("../core/domain/entities/board.js").Board[]>} */
  listBoards(uid) {
    return this.boardRepository.listBoards(uid);
  }

  /** @param {string} uid @param {(boards) => void} onNext @returns {() => void} */
  subscribeBoards(uid, onNext) {
    return this.boardRepository.subscribe(uid, onNext);
  }

  /** @param {object} input @returns {Promise<import("../core/domain/entities/board.js").Board>} */
  createBoard(input) {
    const board = boardEntity.createBoard(input);
    return this.boardRepository.create(board);
  }

  /** @param {string} boardId @returns {Promise<void>} */
  deleteBoard(boardId) {
    return this.boardRepository.remove(boardId);
  }

  /** @param {string} boardId @param {string} uid @returns {Promise<void>} */
  addMember(boardId, uid) {
    return this.boardRepository.addMember(boardId, uid);
  }

  /** @param {string} boardId @param {string} uid @returns {Promise<void>} */
  removeMember(boardId, uid) {
    return this.boardRepository.removeMember(boardId, uid);
  }
}
