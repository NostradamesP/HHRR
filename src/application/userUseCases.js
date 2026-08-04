/**
 * UserUseCases — casos de uso de usuarios de la organización. Depende solo de UserRepository (port).
 * UserUseCases — organization user use cases. Depends only on the UserRepository port.
 *
 * @typedef {import("../ports/UserRepository.js").UserRepository} UserRepository
 */
export class UserUseCases {
  /** @param {UserRepository} userRepository */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /** @param {(users) => void} onNext @param {(err) => void} [onError] @returns {() => void} */
  subscribeUsers(onNext, onError) {
    return this.userRepository.subscribe(onNext, onError);
  }

  /** @param {string} uid @param {string} role @returns {Promise<void>} */
  updateRole(uid, role) {
    return this.userRepository.updateRole(uid, role);
  }

  /** @param {string} uid @param {string} jobTitle @returns {Promise<void>} */
  updateJobTitle(uid, jobTitle) {
    return this.userRepository.updateJobTitle(uid, jobTitle);
  }

  /** @param {string} uid @returns {Promise<void>} */
  removeUser(uid) {
    return this.userRepository.remove(uid);
  }
}
