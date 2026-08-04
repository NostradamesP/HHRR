import { statuses, phaseMap, phases, effortWeight, operationalStates } from "./constants/meta";
import { defaultItConfig } from "./constants/itConfig";
import { initialTasks } from "./constants/tasks";
import * as storageConstants from "./constants/storage";
import * as checklist from "./value-objects/checklist";
import * as date from "./value-objects/date";
import * as taskEntity from "./entities/task";
import * as boardEntity from "./entities/board";
import * as userEntity from "./entities/user";
import * as taskService from "./services/taskService";
import * as filterService from "./services/filterService";
import * as formatService from "./services/formatService";

export {
  statuses,
  phaseMap,
  phases,
  effortWeight,
  operationalStates,
  defaultItConfig,
  initialTasks,
  storageConstants,
  checklist,
  date,
  taskEntity,
  boardEntity,
  userEntity,
  taskService,
  filterService,
  formatService,
};

export const domain = {
  statuses,
  phaseMap,
  phases,
  effortWeight,
  operationalStates,
  defaultItConfig,
  initialTasks,
  storage: storageConstants,
  checklist,
  date,
  entities: {
    task: taskEntity,
    board: boardEntity,
    user: userEntity,
  },
  services: {
    task: taskService,
    filter: filterService,
    format: formatService,
  },
};
