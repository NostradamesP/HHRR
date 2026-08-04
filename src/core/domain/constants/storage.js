export const LOCAL_TASKS_KEY = "norahr.local.tasks";
export const LOCAL_COMMENTS_KEY = "norahr.local.comments";
export const LOCAL_IT_CONFIG_KEY = "norahr.local.itConfig";
export const LOCAL_LOGS_KEY = "norahr.local.logs";
export const LOCAL_ATTACHMENTS_KEY = "norahr.local.attachments";
export const LOCAL_BOARDS_KEY = "norahr.local.boards";
export const LOCAL_ACTIVE_BOARD_KEY = "activeBoardId";

export const DEFAULT_LOCAL_BOARD_ID = "local-demo-board";

export function localTasksKey(boardId) {
  return `${LOCAL_TASKS_KEY}.${boardId || DEFAULT_LOCAL_BOARD_ID}`;
}
