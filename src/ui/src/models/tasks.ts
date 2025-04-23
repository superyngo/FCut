import { BaseClass } from "./BaseModel";
import { TaskSettings } from "./task_setting";
export enum TASK_STATUS {
  Preparing,
  Ready,
  Done,
}

export class Task extends BaseClass {
  constructor(data: {
    id?: string;
    video_path?: string;
    previewUrl?: string;
    renderMethod?: string;
    settings?: TaskSettings;
    status?: TASK_STATUS;
  }) {
    // merge defaults and user-supplied props
    const normalizedData = {
      id: crypto.randomUUID(),
      renderMethod: "",
      settings: {},
      status: TASK_STATUS.Preparing,
      ...data,
    };
    super(normalizedData);
  }
}
