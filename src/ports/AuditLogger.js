/* eslint-disable no-unused-vars */

/**
 * AuditLogger — interface (port) para auditoría de cambios.
 * AuditLogger — interface (port) for change auditing.
 *
 * Implementaciones concretas: src/infrastructure/firebase/…, src/infrastructure/local/…
 */

/**
 * @typedef {Object} AuditEntry
 * @property {string} actor
 * @property {string} action
 * @property {string|null} [boardId]
 * @property {string|null} [taskId]
 * @property {object} [meta]
 * @property {string} timestamp
 */

export class AuditLogger {
  /**
   * @param {AuditEntry} entry
   * @returns {Promise<void>}
   */
  async log(entry) {
    throw new Error("AuditLogger.log not implemented");
  }

  /**
   * @param {string|null} boardId
   * @returns {Promise<AuditEntry[]>}
   */
  async list(boardId) {
    throw new Error("AuditLogger.list not implemented");
  }
}
