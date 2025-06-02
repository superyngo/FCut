import { BaseClass } from "./BaseModel";

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
    settings?: TaskSettings | Partial<ActionSettingsConfig>;
    status?: TASK_STATUS;
    selected?: boolean;
  }) {
    let newSettings: TaskSettings;
    if (data.settings instanceof TaskSettings) {
      // 即使是 TaskSettings 實例，也要創建新的副本以避免共享引用
      newSettings = new TaskSettings(data.settings);
    } else {
      newSettings = new TaskSettings(data.settings);
    }
    super();
    this._init({ ...data, settings: newSettings });
  }
}

// 簡化的設定接口 - 直接使用原始數據類型
export interface ActionSettingsConfig {
  [ACTIONS.CUT]: {
    segments: Array<{ start: string; end: string }>;
  };
  [ACTIONS.SPEEDUP]: {
    multiple: number;
  };
  [ACTIONS.JUMPCUT]: {
    p1_duration: number;
    p2_duration: number;
    p1_multiple: number;
    p2_multiple: number;
  };
  [ACTIONS.CUT_SILENCE]: {
    threshold: number; // dB value
  };
  [ACTIONS.CUT_MOTIONLESS]: {
    threshold: number;
  };
  [ACTIONS.COMPRESS_VIDEO]: {
    quality: number; // CRF value
  };
  [ACTIONS.CONVERT_TO_AUDIO]: {
    quality: number;
  };
}

// 預設設定值
const DEFAULT_SETTINGS: ActionSettingsConfig = {
  [ACTIONS.CUT]: {
    segments: [{ start: "00:00:000", end: "00:00:123" }],
  },
  [ACTIONS.SPEEDUP]: {
    multiple: 3,
  },
  [ACTIONS.JUMPCUT]: {
    p1_duration: 2,
    p2_duration: 2,
    p1_multiple: 1,
    p2_multiple: 8,
  },
  [ACTIONS.CUT_SILENCE]: {
    threshold: -23,
  },
  [ACTIONS.CUT_MOTIONLESS]: {
    threshold: 0.00095,
  },
  [ACTIONS.COMPRESS_VIDEO]: {
    quality: 23,
  },
  [ACTIONS.CONVERT_TO_AUDIO]: {
    quality: 6,
  },
};

export class TaskSettings extends BaseClass {
  [ACTIONS.CUT]: ActionSettingsConfig[ACTIONS.CUT] =
    DEFAULT_SETTINGS[ACTIONS.CUT];
  [ACTIONS.SPEEDUP]: ActionSettingsConfig[ACTIONS.SPEEDUP] =
    DEFAULT_SETTINGS[ACTIONS.SPEEDUP];
  [ACTIONS.JUMPCUT]: ActionSettingsConfig[ACTIONS.JUMPCUT] =
    DEFAULT_SETTINGS[ACTIONS.JUMPCUT];
  [ACTIONS.CUT_SILENCE]: ActionSettingsConfig[ACTIONS.CUT_SILENCE] =
    DEFAULT_SETTINGS[ACTIONS.CUT_SILENCE];
  [ACTIONS.CUT_MOTIONLESS]: ActionSettingsConfig[ACTIONS.CUT_MOTIONLESS] =
    DEFAULT_SETTINGS[ACTIONS.CUT_MOTIONLESS];
  [ACTIONS.COMPRESS_VIDEO]: ActionSettingsConfig[ACTIONS.COMPRESS_VIDEO] =
    DEFAULT_SETTINGS[ACTIONS.COMPRESS_VIDEO];
  [ACTIONS.CONVERT_TO_AUDIO]: ActionSettingsConfig[ACTIONS.CONVERT_TO_AUDIO] =
    DEFAULT_SETTINGS[ACTIONS.CONVERT_TO_AUDIO];

  constructor(settings: Partial<ActionSettingsConfig> = {}) {
    super();

    // 合併傳入的設定與預設值
    if (settings[ACTIONS.CUT]) {
      this[ACTIONS.CUT] = {
        ...DEFAULT_SETTINGS[ACTIONS.CUT],
        ...settings[ACTIONS.CUT],
      };
    }
    if (settings[ACTIONS.SPEEDUP]) {
      this[ACTIONS.SPEEDUP] = {
        ...DEFAULT_SETTINGS[ACTIONS.SPEEDUP],
        ...settings[ACTIONS.SPEEDUP],
      };
    }
    if (settings[ACTIONS.JUMPCUT]) {
      this[ACTIONS.JUMPCUT] = {
        ...DEFAULT_SETTINGS[ACTIONS.JUMPCUT],
        ...settings[ACTIONS.JUMPCUT],
      };
    }
    if (settings[ACTIONS.CUT_SILENCE]) {
      this[ACTIONS.CUT_SILENCE] = {
        ...DEFAULT_SETTINGS[ACTIONS.CUT_SILENCE],
        ...settings[ACTIONS.CUT_SILENCE],
      };
    }
    if (settings[ACTIONS.CUT_MOTIONLESS]) {
      this[ACTIONS.CUT_MOTIONLESS] = {
        ...DEFAULT_SETTINGS[ACTIONS.CUT_MOTIONLESS],
        ...settings[ACTIONS.CUT_MOTIONLESS],
      };
    }
    if (settings[ACTIONS.COMPRESS_VIDEO]) {
      this[ACTIONS.COMPRESS_VIDEO] = {
        ...DEFAULT_SETTINGS[ACTIONS.COMPRESS_VIDEO],
        ...settings[ACTIONS.COMPRESS_VIDEO],
      };
    }
    if (settings[ACTIONS.CONVERT_TO_AUDIO]) {
      this[ACTIONS.CONVERT_TO_AUDIO] = {
        ...DEFAULT_SETTINGS[ACTIONS.CONVERT_TO_AUDIO],
        ...settings[ACTIONS.CONVERT_TO_AUDIO],
      };
    }
  }
  // 獲取特定動作的設定
  getActionSettings(action: ACTIONS) {
    return this[action];
  }

  // 更新特定動作的設定
  updateActionSettings(action: ACTIONS, settings: any): void {
    this[action] = { ...this[action], ...settings };
  } // 重置特定動作的設定為預設值
  resetActionSettings(action: ACTIONS): void {
    (this as any)[action] = { ...DEFAULT_SETTINGS[action] };
  }
}
