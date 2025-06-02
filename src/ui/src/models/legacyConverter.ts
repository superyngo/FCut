// 向後兼容轉換函數
import { ACTIONS, ActionSettingsConfig } from "./tasks";

// 向後兼容：將新格式轉換為舊的 elements 格式
export function convertToLegacyElements(
  action: ACTIONS,
  settings: ActionSettingsConfig[ACTIONS]
): any[] {
  switch (action) {
    case ACTIONS.CUT:
      const cutSettings = settings as ActionSettingsConfig[ACTIONS.CUT];
      return cutSettings.segments.map((segment) => ({
        id: crypto.randomUUID(),
        type: "Container",
        children: [
          {
            id: crypto.randomUUID(),
            type: "InputText",
            label: "Start",
            value: segment.start,
            oldValue: segment.start,
            regexValidator: /^\d{0,2}:\d{0,2}:\d{0,3}$/,
          },
          {
            id: crypto.randomUUID(),
            type: "InputText",
            label: "End",
            value: segment.end,
            oldValue: segment.end,
            regexValidator: /^\d{0,2}:\d{0,2}:\d{0,3}$/,
          },
          {
            id: crypto.randomUUID(),
            type: "Button",
            label: "Remove",
            action: "call_removeCutCell",
          },
        ],
      }));

    case ACTIONS.SPEEDUP:
      const speedSettings = settings as ActionSettingsConfig[ACTIONS.SPEEDUP];
      return [
        {
          id: crypto.randomUUID(),
          type: "InputRange",
          label: "Multiple",
          value: speedSettings.multiple,
          min: 0.1,
          max: 10,
          step: 0.1,
        },
      ];

    case ACTIONS.JUMPCUT:
      const jumpcutSettings = settings as ActionSettingsConfig[ACTIONS.JUMPCUT];
      return [
        {
          id: crypto.randomUUID(),
          type: "InputRange",
          label: "p1_duration",
          value: jumpcutSettings.p1_duration,
          min: 0,
          max: 60,
          step: 0.1,
        },
        {
          id: crypto.randomUUID(),
          type: "InputRange",
          label: "p2_duration",
          value: jumpcutSettings.p2_duration,
          min: 0,
          max: 60,
          step: 0.1,
        },
        {
          id: crypto.randomUUID(),
          type: "InputRange",
          label: "p1_multiple",
          value: jumpcutSettings.p1_multiple,
          min: 0.1,
          max: 10,
          step: 0.1,
        },
        {
          id: crypto.randomUUID(),
          type: "InputRange",
          label: "p2_multiple",
          value: jumpcutSettings.p2_multiple,
          min: 0.1,
          max: 20,
          step: 0.1,
        },
      ];

    case ACTIONS.CUT_SILENCE:
      const silenceSettings =
        settings as ActionSettingsConfig[ACTIONS.CUT_SILENCE];
      return [
        {
          id: crypto.randomUUID(),
          type: "InputRange",
          label: "dB",
          value: silenceSettings.threshold,
          min: -50,
          max: -5,
          step: 1,
        },
      ];

    case ACTIONS.CUT_MOTIONLESS:
      const motionSettings =
        settings as ActionSettingsConfig[ACTIONS.CUT_MOTIONLESS];
      return [
        {
          id: crypto.randomUUID(),
          type: "InputRange",
          label: "Threshold",
          value: motionSettings.threshold,
          min: 0,
          max: 1,
          step: 0.0001,
        },
      ];

    case ACTIONS.COMPRESS_VIDEO:
      const compressSettings =
        settings as ActionSettingsConfig[ACTIONS.COMPRESS_VIDEO];
      return [
        {
          id: crypto.randomUUID(),
          type: "InputRange",
          label: "Quality",
          value: compressSettings.quality,
          min: 0,
          max: 51,
          step: 1,
          title: "越大畫質越好，容量越大",
        },
      ];

    case ACTIONS.CONVERT_TO_AUDIO:
      const audioSettings =
        settings as ActionSettingsConfig[ACTIONS.CONVERT_TO_AUDIO];
      return [
        {
          id: crypto.randomUUID(),
          type: "InputRange",
          label: "Quality",
          value: audioSettings.quality,
          min: 0,
          max: 9,
          step: 1,
          title: "越小畫質越好，容量越大",
        },
      ];

    default:
      return [];
  }
}

// 從舊格式 elements 轉換為新格式（用於從現有數據遷移）
export function convertFromLegacyElements(
  action: ACTIONS,
  elements: any[]
): any {
  switch (action) {
    case ACTIONS.CUT:
      const segments: Array<{ start: string; end: string }> = [];
      elements.forEach((el) => {
        if (el.type === "Container" && "children" in el) {
          const children = el.children;
          if (children && children.length >= 2) {
            const startEl = children.find((c: any) => c.label === "Start");
            const endEl = children.find((c: any) => c.label === "End");
            if (startEl && endEl) {
              segments.push({
                start: startEl.value || "00:00:000",
                end: endEl.value || "00:00:123",
              });
            }
          }
        }
      });
      return {
        segments:
          segments.length > 0
            ? segments
            : [{ start: "00:00:000", end: "00:00:123" }],
      };

    case ACTIONS.SPEEDUP:
      const speedElement = elements.find((el) => el.type === "InputRange");
      return {
        multiple: speedElement ? speedElement.value || 3 : 3,
      };

    case ACTIONS.JUMPCUT:
      const p1DurationEl = elements.find((el) => el.label === "p1_duration");
      const p2DurationEl = elements.find((el) => el.label === "p2_duration");
      const p1MultipleEl = elements.find((el) => el.label === "p1_multiple");
      const p2MultipleEl = elements.find((el) => el.label === "p2_multiple");

      return {
        p1_duration: p1DurationEl ? p1DurationEl.value || 2 : 2,
        p2_duration: p2DurationEl ? p2DurationEl.value || 2 : 2,
        p1_multiple: p1MultipleEl ? p1MultipleEl.value || 1 : 1,
        p2_multiple: p2MultipleEl ? p2MultipleEl.value || 8 : 8,
      };

    case ACTIONS.CUT_SILENCE:
      const silenceElement = elements.find(
        (el) => el.type === "InputRange" && el.label === "dB"
      );
      return {
        threshold: silenceElement ? silenceElement.value || -23 : -23,
      };

    case ACTIONS.CUT_MOTIONLESS:
      const motionElement = elements.find(
        (el) => el.type === "InputRange" && el.label === "Threshold"
      );
      return {
        threshold: motionElement ? motionElement.value || 0.00095 : 0.00095,
      };

    case ACTIONS.COMPRESS_VIDEO:
      const compressionElement = elements.find(
        (el) => el.type === "InputRange" && el.label === "Quality"
      );
      return {
        quality: compressionElement ? compressionElement.value || 23 : 23,
      };

    case ACTIONS.CONVERT_TO_AUDIO:
      const audioQualityElement = elements.find(
        (el) => el.type === "InputRange" && el.label === "Quality"
      );
      return {
        quality: audioQualityElement ? audioQualityElement.value || 6 : 6,
      };

    default:
      return {};
  }
}
