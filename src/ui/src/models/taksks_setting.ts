import { BaseClass } from "./BaseModel";
import { useAPP_STORE } from "../stores/app";
import { Logger } from "../utils/logger";

class _Tasks {
  async save() {
    // Simulate a speedup by reducing the execution time of the task
  }
}

class _InputRange extends BaseClass {
  value: number = 2;
  min: number = 1;
  max: number = 100;
  step: number = 1;
  type: string = "range";
  label?: string = undefined;
  constructor(data: Record<string, any>) {
    super();
    this._init(data);
  }
}

class Custom extends _Tasks {
  multiple: _InputRange = new _InputRange({ value: 2 });
}

class Cut extends _Tasks {
  multiple1: _InputRange = new _InputRange({ value: 3, label: "Mulitiple" });
  multiple2: _InputRange = new _InputRange({ value: 2 });
}

class Speedup extends _Tasks {
  multiple: _InputRange = new _InputRange({ value: 3, label: "Multiple" });
}

class Jumpcut extends _Tasks {
  multiple: _InputRange = new _InputRange({ value: 2 });
}

class CutSilence extends _Tasks {
  multiple: _InputRange = new _InputRange({ value: 2 });
}

class CutMotionless extends _Tasks {
  multiple: _InputRange = new _InputRange({ value: 2 });
}

export function init_settings(task: any) {
  const APP_STORE = useAPP_STORE();
  const ACTIONS = APP_STORE?.constants?.ACTIONS;
  Logger.info(`init_settings ${task.renderMethod}`);
  switch (task.renderMethod) {
    case ACTIONS.Custom:
      task.settings = new Custom();
      break;
    case ACTIONS.Cut:
      task.settings = new Cut();
      break;
    case ACTIONS.Speedup:
      task.settings = new Speedup();
      break;
    case ACTIONS.Jumpcut:
      task.settings = new Jumpcut();
      break;
    case ACTIONS.CutSilence:
      task.settings = new CutSilence();
      break;
    case ACTIONS.CutMotionless:
      task.settings = new CutMotionless();
      break;
    default:
      task.settings = undefined;
  }
}
