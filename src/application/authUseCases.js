import { userEntity } from "../core/domain";

/**
 * AuthUseCases — casos de uso de autenticación y perfil. Depende solo de AuthProvider (port).
 * AuthUseCases — auth and profile use cases. Depends only on the AuthProvider port.
 *
 * @typedef {import("../ports/AuthProvider.js").AuthProvider} AuthProvider
 */
export class AuthUseCases {
  /** @param {AuthProvider} authProvider */
  constructor(authProvider) {
    this.authProvider = authProvider;
  }

  /** @param {(authUser: object|null) => void} onAuthChange @returns {() => void} */
  subscribeAuth(onAuthChange) {
    return this.authProvider.subscribe(onAuthChange);
  }

  /** @param {string} email @param {string} password @returns {Promise<object>} */
  signIn(email, password) {
    return this.authProvider.signIn(email, password);
  }

  /** @param {string} email @param {string} password @param {string} name @returns {Promise<object>} */
  async signUp(email, password, name) {
    const authUser = await this.authProvider.signUp(email, password, name);
    const data = userEntity.createUser({
      uid: authUser.uid,
      email,
      name: name || email.split("@")[0],
    });
    await this.authProvider.saveUserData(authUser.uid, data);
    return authUser;
  }

  /** @returns {Promise<void>} */
  signOut() {
    return this.authProvider.signOut();
  }

  /** @param {string} uid @returns {Promise<import("../core/domain/entities/user.js").UserData|null>} */
  getUserData(uid) {
    return this.authProvider.getUserData(uid);
  }

  /** @param {string} uid @param {object} data @returns {Promise<void>} */
  saveUserData(uid, data) {
    return this.authProvider.saveUserData(uid, data);
  }
}
