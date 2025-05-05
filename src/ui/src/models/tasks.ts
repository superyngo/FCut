import { BaseClass } from "./BaseModel";
import { TaskSettings } from "./task_setting";
export enum TASK_STATUS {
  Preparing,
  Ready,
  Queued,
  Rendering,
  Done,
}

export class Task extends BaseClass {
  constructor(data: {
    readonly id?: string;
    readonly video_path: string;
    previewUrl?: string;
    renderMethod?: string;
    settings?: TaskSettings;
    status?: TASK_STATUS;
    selected?: boolean;
    shift_hovered?: boolean;
  }) {
    // merge defaults and user-supplied props
    const normalizedData = {
      id: crypto.randomUUID(),
      renderMethod: "",
      settings: {},
      status: TASK_STATUS.Preparing,
      selected: false,
      shift_hovered: false,
      ...data,
    };
    super(normalizedData);
  }
  get video_name(): string {
    if (!this.video_path) {
      return "";
    }
    // Get the last part of the path (filename with extension)
    const parts = this.video_path.split(/[\/\\]/);
    return parts[parts.length - 1];
  }
}
