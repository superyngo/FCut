import { MakeOptional, Result } from "./types";
import { logger } from "./logger";

// ==== types ====

// 滑鼠相關事件
export enum MouseEventType {
  Click = "click",
  Mousemove = "mousemove",
  MouseOver = "mouseover",
  MouseOut = "mouseout",
  MouseEnter = "mouseenter",
  MouseLeave = "mouseleave",
  MouseDown = "mousedown",
  MouseUp = "mouseup",
  DblClick = "dblclick",
  ContextMenu = "contextmenu",
  Wheel = "wheel",
}

// 觸控相關事件
export enum TouchEventType {
  TouchStart = "touchstart",
  TouchEnd = "touchend",
  TouchMove = "touchmove",
  TouchCancel = "touchcancel",
}

// 鍵盤相關事件
export enum KeyboardEventType {
  KeyDown = "keydown",
  KeyUp = "keyup",
  KeyPress = "keypress",
}

// 表單相關事件
export enum FormEventType {
  Focus = "focus",
  Blur = "blur",
  Change = "change",
  Input = "input",
  Select = "select",
}

// 剪貼簿相關事件
export enum ClipboardEventType {
  Copy = "copy",
  Cut = "cut",
  Paste = "paste",
}

// 拖放相關事件
export enum DragDropEventType {
  Drag = "drag",
  Drop = "drop",
}

// 其他事件
export enum OtherEventType {
  Scroll = "scroll",
  Resize = "resize",
}

// 所有事件類型的聯合
export type EventType =
  | MouseEventType
  | TouchEventType
  | KeyboardEventType
  | FormEventType
  | ClipboardEventType
  | DragDropEventType
  | OtherEventType;

// ==== Event Listner Core  ====
type EventWithId = {
  id?: string;
} & CustomEvent;

type EventHandler = (event: EventWithId) => void;

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
  removeHook?: () => void; // 用於在移除事件時執行的額外操作
  options?: AddEventListenerOptions;
  decorateFn?: (fn: () => void) => EventHandler; //debounceFn or throttleFn
};

export type ListnerHandle = AbortController & {
  add: () => void;
  remove: () => void;
  swap: (swapCallback: EventHandler) => EventHandler;
  config: ListenerConfig;
  state: EventState;
};

export function addEventListener(
  listenerConfig: MakeOptional<ListenerConfig, "id" | "target">
): Result<ListnerHandle, null> {
  if (typeof window === "undefined") {
    logger.warning(
      "addEventListener is not available in the current environment."
    );
    return Result.err(null);
  }

  listenerConfig.id = listenerConfig.id || crypto.randomUUID();
  listenerConfig.target = listenerConfig.target || window;

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
      logger.debug(
        `已註冊 ${listenerConfig.type} 事件 ${listenerConfig.id} 到 ${listenerConfig.target}.`
      );
      state = EventState.Added;
    } else {
      logger.error(
        `Element with id ${listenerConfig.id} is not a valid Event target.`
      );
      state = EventState.Error;
    }
  }
  function remove() {
    if (state === EventState.Added) {
      listenerConfig.removeHook && listenerConfig.removeHook();
      listenerConfig.target!.removeEventListener(
        listenerConfig.type,
        _callback,
        listenerConfig.options
      );
    }
    logger.debug(
      `已移除 ${listenerConfig.type} 事件 ${listenerConfig.id} 從 ${listenerConfig.target}.`
    );
    state = EventState.Removed;
  }

  add();
  return Result.ok(
    Object.assign(controller, {
      add,
      remove,
      swap: (swapCallback: EventHandler) => {
        [listenerConfig.callback, swapCallback] = [
          swapCallback,
          listenerConfig.callback,
        ];
        logger.debug(
          `已置換 ${listenerConfig.type} 事件 ${listenerConfig.id} 從 ${listenerConfig.target}.`
        );
        return swapCallback;
      },
      config: listenerConfig as ListenerConfig,
      state,
    })
  );
}

// ==== Key Events  ====
export enum MODIFIER_KEYS {
  Alt = "Alt",
  Control = "Control",
  Shift = "Shift",
  Meta = "Meta",
}

type KeyCallbackConfig = {
  key: string; // 監聽觸發的按鍵
  modifiers?: MODIFIER_KEYS[];
  callback: EventHandler; // 事件回調函數
};

/**
 * 創建一個統一的鍵盤事件回調函數，可處理單一或多個按鍵配置
 * @param config 鍵盤事件配置或配置陣列
 * @returns 可註冊至事件監聽器的事件處理函數
 */
export function createKeyEventCallback(
  config: KeyCallbackConfig | KeyCallbackConfig[]
): EventHandler {
  // 將單一配置轉換為陣列
  const configs = Array.isArray(config) ? config : [config];

  return (event: EventWithId) => {
    // 將事件轉換為鍵盤事件
    const keyboardEvent = event as unknown as KeyboardEvent;
    const key = keyboardEvent.key;

    // 迭代所有配置
    for (const cfg of configs) {
      // 檢查按鍵是否匹配
      if (cfg.key === key) {
        // 檢查修飾鍵
        const hasModifiers = cfg.modifiers && cfg.modifiers.length > 0;
        let modifiersMatch = true;

        if (hasModifiers && cfg.modifiers) {
          // 檢查是否所有要求的修飾鍵都被按下
          modifiersMatch = cfg.modifiers.every((modifier) => {
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
            if (!cfg.modifiers) return false;

            switch (mod) {
              case MODIFIER_KEYS.Alt:
                return !cfg.modifiers.includes(mod) && keyboardEvent.altKey;
              case MODIFIER_KEYS.Control:
                return !cfg.modifiers.includes(mod) && keyboardEvent.ctrlKey;
              case MODIFIER_KEYS.Shift:
                return !cfg.modifiers.includes(mod) && keyboardEvent.shiftKey;
              case MODIFIER_KEYS.Meta:
                return !cfg.modifiers.includes(mod) && keyboardEvent.metaKey;
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
          cfg.callback(event);
          return; // 找到匹配的配置並執行後返回
        }
      }
    }
  };
}

const _keyEventsRegistry = {
  keyEventListeners: new Map<KeyboardEventType, ListnerHandle>(),
  registeredKeysOn: new Map<string, boolean>(),
};

function registerKeysEvent(type: KeyboardEventType, key: string) {}
function unregisterKeysEvent(type: KeyboardEventType, key: string) {}
function updateKeysOn(type: KeyboardEventType, key: string) {}

function onKeysDown() {}
function onKeysUp() {}
function onKeysPress() {}
