import { AuditLogger } from "../../ports/AuditLogger";
import { LOCAL_LOGS_KEY } from "../../core/domain/constants/storage";
import { readLocalJSON, writeLocalJSON } from "./storage";

export class LocalStorageAuditLogger extends AuditLogger {
  async log(entry) {
    const all = readLocalJSON(LOCAL_LOGS_KEY, {});
    const key = entry.boardId ?? "_global";
    const record = {
      id: `local-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...entry,
      createdAt: entry.timestamp || new Date().toISOString(),
    };
    all[key] = [...(all[key] || []), record];
    writeLocalJSON(LOCAL_LOGS_KEY, all);
  }

  async list(boardId) {
    const all = readLocalJSON(LOCAL_LOGS_KEY, {});
    return all[boardId] || [];
  }
}
