import { logger } from "../utils/logger";
import { InputRange, InputText } from "./elements";

export enum ACTIONS {
  CUSTOM = "CUSTOM",
  CUT = "CUT",
  SPEEDUP = "SPEEDUP",
  JUMPCUT = "JUMPCUT",
  CUT_SILENCE = "CUT_SILENCE",
  CUT_MOTIONLESS = "CUT_MOTIONLESS",
}

class _TaskSettings {
  async save() {
    // Simulate a speedup by reducing the execution time of the task
  }
}

class Custom extends _TaskSettings {
  multiple: InputRange = new InputRange({ value: 2 });
}

class Cut extends _TaskSettings {
  multiple1: InputText = new InputText({ value: "00:00:00", label: "Start" });
  multiple2: InputText = new InputText({ value: "00:00:00", label: "End" });
}

class Speedup extends _TaskSettings {
  multiple: InputRange = new InputRange({ value: 3, label: "Multiple" });
}

class Jumpcut extends _TaskSettings {
  b1_duration: InputRange = new InputRange({ value: 2, step: 0.1, min: 0 });
  b2_duration: InputRange = new InputRange({ value: 2, step: 0.1, min: 0 });
  b1_multiple: InputRange = new InputRange({ value: 2, step: 0.1 });
  b2_multiple: InputRange = new InputRange({ value: 2, step: 0.1 });
}

class CutSilence extends _TaskSettings {
  dB: InputRange = new InputRange({ value: -23, min: -50, max: -5 });
}

class CutMotionless extends _TaskSettings {
  threshold: InputRange = new InputRange({
    value: 0.00095,
    min: 0,
    max: 1,
    step: 0.0001,
  });
}

export type TaskSettings =
  | Custom
  | Cut
  | Speedup
  | Jumpcut
  | CutSilence
  | CutMotionless
  | {};

export function init_settings(task: any) {
  logger.debug(`init_settings for ${task.renderMethod}`);
  switch (task.renderMethod) {
    case ACTIONS.CUSTOM:
      task.settings = new Custom();
      break;
    case ACTIONS.CUT:
      task.settings = new Cut();
      break;
    case ACTIONS.SPEEDUP:
      task.settings = new Speedup();
      break;
    case ACTIONS.JUMPCUT:
      task.settings = new Jumpcut();
      break;
    case ACTIONS.CUT_SILENCE:
      task.settings = new CutSilence();
      break;
    case ACTIONS.CUT_MOTIONLESS:
      task.settings = new CutMotionless();
      break;
    default:
      task.settings = undefined;
  }
}
