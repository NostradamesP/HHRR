export const LOCAL_TASKS_KEY = "norahr.local.tasks";
export const LOCAL_COMMENTS_KEY = "norahr.local.comments";
export const LOCAL_IT_CONFIG_KEY = "norahr.local.itConfig";
export const LOCAL_LOGS_KEY = "norahr.local.logs";
export const LOCAL_ATTACHMENTS_KEY = "norahr.local.attachments";

export function localTasksKey(boardId) {
  return `${LOCAL_TASKS_KEY}.${boardId || "local-demo-board"}`;
}
