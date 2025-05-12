import { BaseClass } from "./BaseModel";
import { InputRange, InputText } from "./elements";

export enum ACTIONS {
  // CUSTOM = "CUSTOM",
  CUT = "CUT",
  SPEEDUP = "SPEEDUP",
  JUMPCUT = "JUMPCUT",
  CUT_SILENCE = "CUT_SILENCE",
  CUT_MOTIONLESS = "CUT_MOTIONLESS",
  COMPRESS_VIDEO = "COMPRESS_VIDEO",
  CONVERT_TO_AUDIO = "CONVERT_TO_AUDIO",
}

export enum TASK_STATUS {
  Preparing,
  Ready,
  Queued,
  Rendering,
  Done,
}
export class Task extends BaseClass {
  readonly id: string = crypto.randomUUID();
  readonly videoPath: string = "";
  previewUrl?: string;
  renderMethod: ACTIONS | "" = "";
  settings?: TaskSettings;
  status: TASK_STATUS = TASK_STATUS.Preparing;
  selected: boolean = false;
  get videoName(): string {
    if (!this.videoPath) {
      return "";
    }
    const parts = this.videoPath.split(/[\/\\]/);
    return parts[parts.length - 1];
  }
  constructor(data: {
    readonly id?: string;
    readonly videoPath: string;
    previewUrl?: string;
    renderMethod?: string;
    settings?: TaskSettings;
    status?: TASK_STATUS;
    selected?: boolean;
  }) {
    let newSettings = new TaskSettings(data.settings);
    super();
    this._init({ ...data, settings: newSettings });
  }
}

export class TaskSettings extends BaseClass {
  // [ACTIONS.CUSTOM]: TaskSetting = [];
  [ACTIONS.CUT]: TaskSetting = [];
  [ACTIONS.SPEEDUP]: TaskSetting = [];
  [ACTIONS.JUMPCUT]: TaskSetting = [];
  [ACTIONS.CUT_SILENCE]: TaskSetting = [];
  [ACTIONS.CUT_MOTIONLESS]: TaskSetting = [];
  [ACTIONS.COMPRESS_VIDEO]: TaskSetting = [];
  [ACTIONS.CONVERT_TO_AUDIO]: TaskSetting = [];
  constructor(taskSettings: Record<ACTIONS, TaskSetting> | {} = {}) {
    let _taskSettings: Record<ACTIONS, TaskSetting> = {
      // [ACTIONS.CUSTOM]:
      //   ACTIONS.CUSTOM in taskSettings
      //     ? wrapTaskSetting(taskSettings[ACTIONS.CUSTOM])
      //     : [new InputRange({ value: 2 })],
      [ACTIONS.CUT]:
        ACTIONS.CUT in taskSettings
          ? taskSettings[ACTIONS.CUT]
          : [
              new InputText({ label: "Start", value: "00:00:00" }),
              new InputText({ label: "End", value: "00:00:00" }),
            ],
      [ACTIONS.SPEEDUP]:
        ACTIONS.SPEEDUP in taskSettings
          ? wrapTaskSetting(taskSettings[ACTIONS.SPEEDUP])
          : [new InputRange({ label: "Multiple", value: 3 })],
      [ACTIONS.JUMPCUT]:
        ACTIONS.JUMPCUT in taskSettings
          ? wrapTaskSetting(taskSettings[ACTIONS.JUMPCUT])
          : [
              new InputRange({
                label: "p1_duration",
                value: 2,
                step: 0.1,
                min: 0,
              }),
              new InputRange({
                label: "p2_duration",
                value: 2,
                step: 0.1,
                min: 0,
              }),
              new InputRange({ label: "p1_multiple", value: 2, step: 0.1 }),
              new InputRange({ label: "p1_multiple", value: 2, step: 0.1 }),
            ],
      [ACTIONS.CUT_SILENCE]:
        ACTIONS.CUT_SILENCE in taskSettings
          ? wrapTaskSetting(taskSettings[ACTIONS.CUT_SILENCE])
          : [new InputRange({ label: "dB", value: -23, min: -50, max: -5 })],
      [ACTIONS.CUT_MOTIONLESS]:
        ACTIONS.CUT_MOTIONLESS in taskSettings
          ? wrapTaskSetting(taskSettings[ACTIONS.CUT_MOTIONLESS])
          : [
              new InputRange({
                label: "Threshold",
                value: 0.00095,
                min: 0,
                max: 1,
                step: 0.0001,
              }),
            ],
      [ACTIONS.COMPRESS_VIDEO]:
        ACTIONS.COMPRESS_VIDEO in taskSettings
          ? wrapTaskSetting(taskSettings[ACTIONS.COMPRESS_VIDEO])
          : [new InputRange({ value: 2 })],
      [ACTIONS.CONVERT_TO_AUDIO]:
        ACTIONS.CONVERT_TO_AUDIO in taskSettings
          ? wrapTaskSetting(taskSettings[ACTIONS.CONVERT_TO_AUDIO])
          : [new InputRange({ value: 2 })],
    };
    super();
    this._init(_taskSettings);
  }
}

export type TaskSetting = (InputRange | InputText)[];

function wrapTaskSetting(taskSetting: TaskSetting): TaskSetting {
  return taskSetting.map((setting) => {
    switch (setting.type) {
      case "InputRange":
        return new InputRange(setting as InputRange);
      case "InputText":
        return new InputText(setting as InputText);
      default:
        throw new Error("Invalid task setting type");
    }
  });
}
