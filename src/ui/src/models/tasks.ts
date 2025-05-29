import { BaseClass } from "./BaseModel";
import {
  AllBaseElements,
  initElementsData,
  InputRange,
  InputText,
  Button,
  Selection,
  Container,
  createCutCell,
} from "./elements";

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
  [ACTIONS.CUT]: AllBaseElements[] = [];
  [ACTIONS.SPEEDUP]: AllBaseElements[] = [];
  [ACTIONS.JUMPCUT]: AllBaseElements[] = [];
  [ACTIONS.CUT_SILENCE]: AllBaseElements[] = [];
  [ACTIONS.CUT_MOTIONLESS]: AllBaseElements[] = [];
  [ACTIONS.COMPRESS_VIDEO]: AllBaseElements[] = [];
  [ACTIONS.CONVERT_TO_AUDIO]: AllBaseElements[] = [];

  constructor(taskSettings: Record<ACTIONS, AllBaseElements[]> | {} = {}) {
    let _taskSettings: Record<ACTIONS, AllBaseElements[]> = {
      [ACTIONS.CUT]: initElementsData(
        taskSettings && ACTIONS.CUT in taskSettings
          ? taskSettings[ACTIONS.CUT]
          : [
              createCutCell(),
              new Button(
                {
                  label: "Add",
                  // 使用註冊的方法
                  action: "call_tt",
                },
                true
              ),
            ],
        (self) => {
          // 時間戳格式化函數
          const formatTimestamp = (timeStr: string): string => {
            if (!timeStr) return "00:00:000";

            const parts = timeStr.split(":");
            let minutes = "00";
            let seconds = "00";
            let milliseconds = "000";

            if (parts.length >= 1) {
              minutes = parts[0].padStart(2, "0");
            }
            if (parts.length >= 2) {
              seconds = parts[1].padStart(2, "0");
            }
            if (parts.length >= 3) {
              milliseconds = parts[2].padEnd(3, "0");
            }

            return `${minutes}:${seconds}:${milliseconds}`;
          };

          // 時間戳比較函數（轉換為總毫秒數進行比較）
          const timestampToMs = (timeStr: string): number => {
            const formatted = formatTimestamp(timeStr);
            const [minutes, seconds, ms] = formatted.split(":").map(Number);
            return minutes * 60000 + seconds * 1000 + ms;
          };

          // 格式化時間戳
          const startTime = formatTimestamp(self[0].children[0].value);
          const endTime = formatTimestamp(self[0].children[1].value);

          // 更新格式化後的值
          self[0].children[0].value = startTime;
          self[0].children[1].value = endTime;

          // 比較時間戳大小
          const startMs = timestampToMs(startTime);
          const endMs = timestampToMs(endTime);

          if (endMs <= startMs) {
            return { result: false, message: "End Time 應大於 Start Time" };
          }

          return { result: true, message: "Success" };
        }
      ),

      [ACTIONS.SPEEDUP]: initElementsData(
        ACTIONS.SPEEDUP in taskSettings
          ? taskSettings[ACTIONS.SPEEDUP]
          : [new InputRange({ label: "Multiple", value: 3 })]
      ),

      [ACTIONS.JUMPCUT]: initElementsData(
        taskSettings && ACTIONS.JUMPCUT in taskSettings
          ? taskSettings[ACTIONS.JUMPCUT]
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
            ]
      ),

      [ACTIONS.CUT_SILENCE]: initElementsData(
        taskSettings && ACTIONS.CUT_SILENCE in taskSettings
          ? taskSettings[ACTIONS.CUT_SILENCE]
          : [new InputRange({ label: "dB", value: -23, min: -50, max: -5 })]
      ),

      [ACTIONS.CUT_MOTIONLESS]: initElementsData(
        taskSettings && ACTIONS.CUT_MOTIONLESS in taskSettings
          ? taskSettings[ACTIONS.CUT_MOTIONLESS]
          : [
              new InputRange({
                label: "Threshold",
                value: 0.00095,
                min: 0,
                max: 1,
                step: 0.0001,
              }),
            ]
      ),

      [ACTIONS.COMPRESS_VIDEO]: initElementsData(
        taskSettings && ACTIONS.COMPRESS_VIDEO in taskSettings
          ? taskSettings[ACTIONS.COMPRESS_VIDEO]
          : [
              new InputRange({
                label: "Quality",
                title: "越大畫質越好，容量越大",
                value: 23,
                min: 0,
                max: 51,
              }),
            ]
      ), // crf 51 is best quality

      [ACTIONS.CONVERT_TO_AUDIO]: initElementsData(
        taskSettings && ACTIONS.CONVERT_TO_AUDIO in taskSettings
          ? taskSettings[ACTIONS.CONVERT_TO_AUDIO]
          : [
              new InputRange({
                label: "Quality",
                title: "越小畫質越好，容量越大",
                value: 6,
                min: 0,
                max: 9,
              }),
            ]
      ), // -q:a 0 is best quality
    };

    super();
    this._init(_taskSettings);
  }
}
