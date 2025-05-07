import { logger } from "../utils/logger";
import { BaseMap } from "./BaseModel";
import { InputRange, InputText } from "./elements";
import { Task } from "../models/tasks";

export enum ACTIONS {
  CUSTOM = "CUSTOM",
  CUT = "CUT",
  SPEEDUP = "SPEEDUP",
  JUMPCUT = "JUMPCUT",
  CUT_SILENCE = "CUT_SILENCE",
  CUT_MOTIONLESS = "CUT_MOTIONLESS",
}

class _InitTaskSetting<K, V> extends BaseMap<K, V> {
  constructor(data: Record<string, any> = {}) {
    super();
    this._init(data);
  }

  // async save() {
  //   // Simulate a speedup by reducing the execution time of the task
  // }
}

// 使用map來生產所有TaskSettingsType的實例
const _initTaskSettings = {
  [ACTIONS.CUSTOM]: (): _InitTaskSetting<string, InputRange> =>
    new _InitTaskSetting({
      multiple: new InputRange({ value: 2 }),
    }),
  [ACTIONS.CUT]: (): _InitTaskSetting<string, InputText> =>
    new _InitTaskSetting({
      multiple1: new InputText({ value: "00:00:00", label: "Start" }),
      multiple2: new InputText({ value: "00:00:00", label: "End" }),
    }),
  [ACTIONS.SPEEDUP]: (): _InitTaskSetting<string, InputRange> =>
    new _InitTaskSetting({
      multiple: new InputRange({ value: 3, label: "Multiple" }),
    }),
  [ACTIONS.JUMPCUT]: (): _InitTaskSetting<string, InputRange> =>
    new _InitTaskSetting({
      b1_duration: new InputRange({ value: 2, step: 0.1, min: 0 }),
      b2_duration: new InputRange({ value: 2, step: 0.1, min: 0 }),
      b1_multiple: new InputRange({ value: 2, step: 0.1 }),
      b2_multiple: new InputRange({ value: 2, step: 0.1 }),
    }),
  [ACTIONS.CUT_SILENCE]: (): _InitTaskSetting<string, InputRange> =>
    new _InitTaskSetting({
      dB: new InputRange({ value: -23, min: -50, max: -5 }),
    }),
  [ACTIONS.CUT_MOTIONLESS]: (): _InitTaskSetting<string, InputRange> =>
    new _InitTaskSetting({
      threshold: new InputRange({
        value: 0.00095,
        min: 0,
        max: 1,
        step: 0.0001,
      }),
    }),
};

export function initTaskSettings(task: Task) {
  logger.debug(`Init task settings to ${task.renderMethod}`);
  // 直接使用 taskSettingsMapper 產生對應的設定實例
  const settingsFactory = _initTaskSettings[task.renderMethod as ACTIONS];
  task.settings = settingsFactory ? settingsFactory() : new _InitTaskSetting();
}

// 最終的TaskSettingType型別是TaskSettingsType屬性名稱與值的映射
export type TaskSettingType = _InitTaskSetting<string, InputRange | InputText>;
