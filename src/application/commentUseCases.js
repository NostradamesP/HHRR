/**
 * CommentUseCases — casos de uso de comentarios. Depende solo de CommentRepository (port).
 * CommentUseCases — comment use cases. Depends only on the CommentRepository port.
 *
 * @typedef {import("../ports/CommentRepository.js").CommentRepository} CommentRepository
 */
export class CommentUseCases {
  /** @param {CommentRepository} commentRepository */
  constructor(commentRepository) {
    this.commentRepository = commentRepository;
  }

  /** @param {string|null} boardId @param {string} taskId @param {(comments) => void} onNext @param {(err) => void} [onError] @returns {() => void} */
  subscribeComments(boardId, taskId, onNext, onError) {
    return this.commentRepository.subscribe(boardId, taskId, onNext, onError);
  }

  /** @param {string|null} boardId @param {string} taskId @param {object} input @returns {Promise<object>} */
  addComment(boardId, taskId, input) {
    return this.commentRepository.add(boardId, taskId, input);
  }
}
