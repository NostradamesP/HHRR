/* eslint-disable no-unused-vars */

/**
 * AuthProvider — interface (port) para autenticación y perfil de usuario.
 * AuthProvider — interface (port) for authentication and user profile.
 *
 * Implementaciones concretas: src/infrastructure/firebase/…, src/infrastructure/local/…
 */

export class AuthProvider {
  /**
   * @param {(authUser: object|null) => void} onAuthChange
   * @returns {() => void} unsubscribe
   */
  subscribe(onAuthChange) {
    throw new Error("AuthProvider.subscribe not implemented");
  }

  /**
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>} authUser
   */
  async signIn(email, password) {
    throw new Error("AuthProvider.signIn not implemented");
  }

  /**
   * @param {string} email
   * @param {string} password
   * @param {string} name
   * @returns {Promise<object>} authUser
   */
  async signUp(email, password, name) {
    throw new Error("AuthProvider.signUp not implemented");
  }

  /**
   * @returns {Promise<void>}
   */
  async signOut() {
    throw new Error("AuthProvider.signOut not implemented");
  }

  /**
   * @param {string} uid
   * @returns {Promise<import("../core/domain/entities/user.js").UserData|null>}
   */
  async getUserData(uid) {
    throw new Error("AuthProvider.getUserData not implemented");
  }

  /**
   * @param {string} uid
   * @param {import("../core/domain/entities/user.js").UserData} data
   * @returns {Promise<void>}
   */
  async saveUserData(uid, data) {
    throw new Error("AuthProvider.saveUserData not implemented");
  }
}
