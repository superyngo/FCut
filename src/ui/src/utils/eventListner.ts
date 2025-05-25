import { MakeOptional } from "./types";

export enum EventType {
  Click = "click",
  Mousemove = "mousemove",
  MouseOver = "mouseover",
  MouseOut = "mouseout",
  MouseEnter = "mouseenter",
  MouseLeave = "mouseleave",
  MouseDown = "mousedown",
  MouseUp = "mouseup",
  TouchStart = "touchstart",
  TouchEnd = "touchend",
  TouchMove = "touchmove",
  TouchCancel = "touchcancel",
  Wheel = "wheel",
  ContextMenu = "contextmenu",
  Scroll = "scroll",
  Resize = "resize",
  Copy = "copy",
  Cut = "cut",
  Paste = "paste",
  DblClick = "dblclick",
  Select = "select",
  KeyDown = "keydown",
  KeyUp = "keyup",
  KeyPress = "keypress",
  Focus = "focus",
  Blur = "blur",
  Change = "change",
  Input = "input",
  Drag = "drag",
  Drop = "drop",
}

type EventHandler = (event: EventWithId) => void;

export enum MODIFIER_KEYS {
  Alt = "Alt",
  Control = "Control",
  Shift = "Shift",
  Meta = "Meta",
}
enum EventState {
  Init = "Init",
  Added = "Added",
  Removed = "removed",
  Error = "Error",
}

type ListenerConfig = {
  id: string;
  target: EventTarget;
  type: EventType;
  callback: EventHandler;
  options?: AddEventListenerOptions;
  decorateFn?: (fn: () => void) => EventHandler; //debounceFn or throttleFn
};
type EventWithId = {
  id?: string;
} & CustomEvent;

type ListnerHandle = AbortController & {
  add: () => void;
  remove: () => void;
  swap: (swapCallback: (event: Event) => void) => (event: EventWithId) => void;
  config: ListenerConfig;
  state: EventState;
};

export function addEventListener(
  listenerConfig: MakeOptional<ListenerConfig, "id">
): ListnerHandle {
  listenerConfig.id = listenerConfig.id || crypto.randomUUID();
  if (listenerConfig.decorateFn) {
    listenerConfig.callback = listenerConfig.decorateFn(() =>
      listenerConfig.callback(event as EventWithId)
    );
  }

  const controller = new AbortController();

  let _callback = function (event: Event) {
    const eventWithId = event as EventWithId;
    eventWithId.id = listenerConfig.id;
    listenerConfig.callback(eventWithId);
  };

  let state: EventState = EventState.Init;

  function add() {
    if (listenerConfig.target instanceof EventTarget) {
      listenerConfig.target.addEventListener(listenerConfig.type, _callback, {
        signal: controller.signal,
        ...listenerConfig.options,
      });
      state = EventState.Added;
    } else {
      console.error(
        `Element with id ${listenerConfig.id} is not a valid Event target.`
      );
      state = EventState.Error;
    }
  }
  function remove() {
    if (state === EventState.Added) {
      listenerConfig.target.removeEventListener(
        listenerConfig.type,
        _callback,
        listenerConfig.options
      );
    }
    state = EventState.Removed;
  }

  add();

  return Object.assign(controller, {
    add,
    remove,
    swap: (swapCallback: (event: Event) => void) => {
      [listenerConfig.callback, swapCallback] = [
        swapCallback,
        listenerConfig.callback,
      ];
      return swapCallback;
    },
    config: listenerConfig as ListenerConfig,
    state,
  });
}

type KeyCallbackConfig = Omit<ListenerConfig, "type"> & {
  type: EventType.KeyUp | EventType.KeyDown | EventType.KeyPress; // 事件類型，使用 KeyEvents 枚舉
  key: string; // 監聽觸發的按鍵
  modifiers?: MODIFIER_KEYS[];
};

/**
 * 創建一個統一的鍵盤事件回調函數，可處理多種按鍵配置
 * @param configs 鍵盤事件配置陣列
 * @returns 可註冊至事件監聽器的事件處理函數
 */
export function createKeyEventCallback(
  configs: KeyCallbackConfig[]
): EventHandler {
  return (event: EventWithId) => {
    // 將事件轉換為鍵盤事件
    const keyboardEvent = event as unknown as KeyboardEvent;
    const key = keyboardEvent.key;
    const type = event.type as
      | EventType.KeyDown
      | EventType.KeyUp
      | EventType.KeyPress;

    // 檢查是否為鍵盤事件
    if (
      type !== EventType.KeyDown &&
      type !== EventType.KeyUp &&
      type !== EventType.KeyPress
    ) {
      return;
    }

    // 迭代所有配置
    for (const config of configs) {
      // 檢查事件類型和按鍵是否匹配
      if (config.type === type && config.key === key) {
        // 檢查修飾鍵
        const hasModifiers = config.modifiers && config.modifiers.length > 0;
        let modifiersMatch = true;

        if (hasModifiers && config.modifiers) {
          // 檢查是否所有要求的修飾鍵都被按下
          modifiersMatch = config.modifiers.every((modifier) => {
            switch (modifier) {
              case MODIFIER_KEYS.Alt:
                return keyboardEvent.altKey;
              case MODIFIER_KEYS.Control:
                return keyboardEvent.ctrlKey;
              case MODIFIER_KEYS.Shift:
                return keyboardEvent.shiftKey;
              case MODIFIER_KEYS.Meta:
                return keyboardEvent.metaKey;
              default:
                return false;
            }
          });

          // 檢查是否有未指定但被按下的修飾鍵
          const allModifiers = [
            MODIFIER_KEYS.Alt,
            MODIFIER_KEYS.Control,
            MODIFIER_KEYS.Shift,
            MODIFIER_KEYS.Meta,
          ];
          const unexpectedModifiers = allModifiers.filter((mod) => {
            if (!config.modifiers) return false;

            switch (mod) {
              case MODIFIER_KEYS.Alt:
                return !config.modifiers.includes(mod) && keyboardEvent.altKey;
              case MODIFIER_KEYS.Control:
                return !config.modifiers.includes(mod) && keyboardEvent.ctrlKey;
              case MODIFIER_KEYS.Shift:
                return (
                  !config.modifiers.includes(mod) && keyboardEvent.shiftKey
                );
              case MODIFIER_KEYS.Meta:
                return !config.modifiers.includes(mod) && keyboardEvent.metaKey;
              default:
                return false;
            }
          });

          // 如果有未指定但被按下的修飾鍵，那麼不匹配
          if (unexpectedModifiers.length > 0) {
            modifiersMatch = false;
          }
        } else {
          // 如果沒有要求修飾鍵，但有修飾鍵被按下，則不匹配
          if (
            keyboardEvent.altKey ||
            keyboardEvent.ctrlKey ||
            keyboardEvent.shiftKey ||
            keyboardEvent.metaKey
          ) {
            modifiersMatch = false;
          }
        }

        // 如果修飾鍵也匹配，執行回調函數
        if (modifiersMatch) {
          config.callback(event);
          return; // 找到匹配的配置並執行後返回
        }
      }
    }
  };
}

/**
 * 使用示例：
 *
 * ```typescript
 * // 定義快捷鍵配置
 * const keyConfigs: KeyCallbackConfig[] = [
 *   {
 *     key: "Shift",
 *     type: EventType.KeyDown,
 *     callback: onShiftPress,
 *   },
 *   {
 *     key: "Shift",
 *     type: EventType.KeyUp,
 *     callback: onShiftRelease,
 *   },
 *   {
 *     key: "a",
 *     type: EventType.KeyDown,
 *     callback: selectAllTasks,
 *     modifiers: [MODIFIER_KEYS.Control],
 *   },
 *   {
 *     key: "Escape",
 *     type: EventType.KeyDown,
 *     callback: unselectAllTasks,
 *   },
 * ];
 *
 * // 創建統一的鍵盤事件處理器
 * const keyEventHandler = createKeyEventCallback(keyConfigs);
 *
 * // 註冊到事件監聽器
 * const keydownListener = addEventListener({
 *   target: document,
 *   type: EventType.KeyDown,
 *   callback: keyEventHandler,
 * });
 *
 * const keyupListener = addEventListener({
 *   target: document,
 *   type: EventType.KeyUp,
 *   callback: keyEventHandler,
 * });
 * ```
 */
