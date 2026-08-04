/**
 * MessageUseCases — casos de uso de mensajes del chat. Depende solo de MessageRepository (port).
 * MessageUseCases — board chat message use cases. Depends only on the MessageRepository port.
 *
 * @typedef {import("../ports/MessageRepository.js").MessageRepository} MessageRepository
 */
export class MessageUseCases {
  /** @param {MessageRepository} messageRepository */
  constructor(messageRepository) {
    this.messageRepository = messageRepository;
  }

  /** @param {string|null} boardId @param {(messages) => void} onNext @param {(err) => void} [onError] @returns {() => void} */
  subscribeMessages(boardId, onNext, onError) {
    return this.messageRepository.subscribe(boardId, onNext, onError);
  }

  /** @param {string|null} boardId @param {object} input @returns {Promise<object>} */
  addMessage(boardId, input) {
    return this.messageRepository.add(boardId, input);
  }
}
