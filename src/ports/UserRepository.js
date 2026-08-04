/* eslint-disable no-unused-vars */

/**
 * UserRepository — interface (port) para la lista de usuarios de la organización.
 * UserRepository — interface (port) for the organization user list.
 *
 * Implementaciones concretas: src/infrastructure/firebase/…, src/infrastructure/local/…
 */

export class UserRepository {
  /**
   * @param {(users: import("../core/domain/entities/user.js").UserData[]) => void} onNext
   * @param {(err: Error) => void} [onError]
   * @returns {() => void} unsubscribe
   */
  subscribe(onNext, onError) {
    throw new Error("UserRepository.subscribe not implemented");
  }

  /**
   * @param {string} uid
   * @param {string} role
   * @returns {Promise<void>}
   */
  async updateRole(uid, role) {
    throw new Error("UserRepository.updateRole not implemented");
  }

  /**
   * @param {string} uid
   * @param {string} jobTitle
   * @returns {Promise<void>}
   */
  async updateJobTitle(uid, jobTitle) {
    throw new Error("UserRepository.updateJobTitle not implemented");
  }

  /**
   * @param {string} uid
   * @returns {Promise<void>}
   */
  async remove(uid) {
    throw new Error("UserRepository.remove not implemented");
  }
}
