import { BaseClass } from "./BaseModel";
import {
  AllBaseElementsData,
  initElementsData,
  InputRange,
  InputText,
  Button,
  Selection,
  Container,
} from "./elements";
import { enumToOptions } from "../utils/common";
import { logger } from "../utils/logger";
import { methodRegistry } from "../models/elements";

export enum ACTIONS {
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

enum VIDEO_QUALITY {
  "Very Low" = 1,
  "Low" = 2,
  "Medium" = 3,
  "High" = 4,
  "Very High" = 5,
}

export class TaskSettings extends BaseClass {
  [ACTIONS.CUT]: AllBaseElementsData = [];
  [ACTIONS.SPEEDUP]: AllBaseElementsData = [];
  [ACTIONS.JUMPCUT]: AllBaseElementsData = [];
  [ACTIONS.CUT_SILENCE]: AllBaseElementsData = [];
  [ACTIONS.CUT_MOTIONLESS]: AllBaseElementsData = [];
  [ACTIONS.COMPRESS_VIDEO]: AllBaseElementsData = [];
  [ACTIONS.CONVERT_TO_AUDIO]: AllBaseElementsData = [];

  constructor(taskSettings: Record<ACTIONS, AllBaseElementsData> | {} = {}) {
    let _taskSettings: Record<ACTIONS, AllBaseElementsData> = {
      [ACTIONS.CUT]: initElementsData(
        taskSettings && ACTIONS.CUT in taskSettings
          ? taskSettings[ACTIONS.CUT]
          : [
              new Container({
                children: [
                  new InputText({ label: "Start", value: "00:00:00" }),
                  new InputText({ label: "End", value: "00:00:00" }),
                ],
              }),
              new Button({
                label: "Add",
                // 使用註冊的方法
                action: "call_tt",
              }),
            ]
      ),

      [ACTIONS.SPEEDUP]:
        ACTIONS.SPEEDUP in taskSettings
          ? initElementsData(taskSettings[ACTIONS.SPEEDUP])
          : [new InputRange({ label: "Multiple", value: 3 })],

      [ACTIONS.JUMPCUT]:
        ACTIONS.JUMPCUT in taskSettings
          ? initElementsData(taskSettings[ACTIONS.JUMPCUT])
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
          ? initElementsData(taskSettings[ACTIONS.CUT_SILENCE])
          : [new InputRange({ label: "dB", value: -23, min: -50, max: -5 })],

      [ACTIONS.CUT_MOTIONLESS]:
        ACTIONS.CUT_MOTIONLESS in taskSettings
          ? initElementsData(taskSettings[ACTIONS.CUT_MOTIONLESS])
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
          ? initElementsData(taskSettings[ACTIONS.COMPRESS_VIDEO])
          : [new InputRange({ label: "Quality", value: 23, min: 0, max: 51 })], // crf 51 is best quality

      [ACTIONS.CONVERT_TO_AUDIO]:
        ACTIONS.CONVERT_TO_AUDIO in taskSettings
          ? initElementsData(taskSettings[ACTIONS.CONVERT_TO_AUDIO])
          : [new InputRange({ label: "Quality", value: 6, min: 0, max: 9 })], // -q:a 0 is best quality
    };

    super();
    this._init(_taskSettings);
  }
}
