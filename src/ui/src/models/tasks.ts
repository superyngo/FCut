import { BaseClass } from "./BaseModel";
import { TaskSettingType } from "./taskSetting";
export enum TASK_STATUS {
  Preparing = "Preparing",
  Ready = "Ready",
  Queued = "Queued",
  Rendering = "Rendering",
  Done = "Done",
}

export type TaskType = {
  readonly id?: string;
  readonly videoPath: string;
  previewUrl?: string;
  renderMethod?: string;
  settings?: TaskSettingType;
  status?: TASK_STATUS;
  selected?: boolean;
};

export class Task extends BaseClass {
  constructor(data: TaskType) {
    // merge defaults and user-supplied props
    const normalizedData = {
      id: crypto.randomUUID(),
      renderMethod: "",
      settings: {},
      status: TASK_STATUS.Preparing,
      selected: false,
      ...data,
    };
    super(normalizedData);
  }
  get videoName(): string {
    if (!this.videoPath) {
      return "";
    }
    // Get the last part of the path (filename with extension)
    const parts = this.videoPath.split(/[\/\\]/);
    return parts[parts.length - 1];
  }
}
