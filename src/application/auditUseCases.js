/**
 * AuditUseCases — casos de uso de auditoría. Depende solo de AuditLogger (port).
 * AuditUseCases — audit use cases. Depends only on the AuditLogger port.
 *
 * @typedef {import("../ports/AuditLogger.js").AuditLogger} AuditLogger
 */
export class AuditUseCases {
  /** @param {AuditLogger} auditLogger */
  constructor(auditLogger) {
    this.auditLogger = auditLogger;
  }

  /** @param {import("../ports/AuditLogger.js").AuditEntry} entry @returns {Promise<void>} */
  log(entry) {
    return this.auditLogger.log(entry);
  }

  /** @param {string|null} boardId @returns {Promise<import("../ports/AuditLogger.js").AuditEntry[]>} */
  list(boardId) {
    return this.auditLogger.list(boardId);
  }
}
