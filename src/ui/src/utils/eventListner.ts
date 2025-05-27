import { MakeOptional, Result } from "./types";
import { logger } from "./logger";
import { throttle, debounce } from "lodash-es"; // 引入 lodash-es

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
} & (CustomEvent | KeyboardEvent | MouseEvent | TouchEvent | Event);

type EventHandler = (event: EventWithId) => void;

enum ListnerState {
  Inited = "Inited",
  Added = "Added",
  Removed = "Removed",
  Error = "Error",
}

type ListenerConfig = {
  id: string;
  target: EventTarget;
  type: EventType;
  callback: EventHandler;
  addHook?: () => void; // 用於在添加事件時執行的額外操作
  removeHook?: () => void; // 用於在移除事件時執行的額外操作
  options?: AddEventListenerOptions;
  decorateFn?: (handler: EventHandler) => EventHandler; //debounceFn or throttleFn
};

export type ListnerHandle = AbortController & {
  add: () => void;
  remove: () => void;
  swap: (swapCallback: EventHandler) => EventHandler;
  config: ListenerConfig;
  state: ListnerState;
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
    // 直接將原始 callback 傳遞給 decorateFn
    listenerConfig.callback = listenerConfig.decorateFn(
      listenerConfig.callback
    );
  }

  const controller = new AbortController();

  let _callback = function (event: Event) {
    const eventWithId = event as EventWithId;
    eventWithId.id = listenerConfig.id;
    listenerConfig.callback(eventWithId);
  };

  let state: ListnerState = ListnerState.Inited;

  function add(): Result<true, false> {
    if (listenerConfig.target instanceof EventTarget) {
      listenerConfig.addHook && listenerConfig.addHook();
      listenerConfig.target.addEventListener(listenerConfig.type, _callback, {
        signal: controller.signal,
        ...listenerConfig.options,
      });
      logger.debug(
        `已註冊 ${listenerConfig.type} 事件 ${listenerConfig.id} 到 ${listenerConfig.target}.`
      );
      state = ListnerState.Added;
      return Result.ok(true);
    } else {
      logger.error(
        `Element with id ${listenerConfig.id} is not a valid Event target.`
      );
      state = ListnerState.Error;
      return Result.err(false);
    }
  }
  function remove(): Result<true, false> {
    if (state === ListnerState.Added) {
      listenerConfig.removeHook && listenerConfig.removeHook();
      listenerConfig.target!.removeEventListener(
        listenerConfig.type,
        _callback,
        listenerConfig.options
      );
      logger.debug(
        `已移除 ${listenerConfig.type} 事件 ${listenerConfig.id} 從 ${listenerConfig.target}.`
      );
      state = ListnerState.Removed;
      return Result.ok(true);
    } else {
      logger.error(
        `Cannot remove event listener ${listenerConfig.id} because it is not in the Added state. Current state: ${state}.`
      );
      return Result.err(false);
    }
  }

  let adddResult = add();
  if (adddResult.isOk()) {
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
  } else return Result.err(null);
}

// ==== Key Events  ====
export enum MODIFIER_KEYS {
  Alt = "Alt",
  Control = "Control",
  Shift = "Shift",
  Meta = "Meta",
}

// Key Modifiers 與 Event FnKey屬性的映射
const modifierKeyMap: { [key in MODIFIER_KEYS]: keyof KeyboardEvent } = {
  [MODIFIER_KEYS.Alt]: "altKey",
  [MODIFIER_KEYS.Control]: "ctrlKey",
  [MODIFIER_KEYS.Shift]: "shiftKey",
  [MODIFIER_KEYS.Meta]: "metaKey",
};

export type KeyCallbackConfig = {
  type: KeyboardEventType; // 鍵盤事件類型
  key: string; // 監聽觸發的按鍵
  modifiers?: MODIFIER_KEYS[];
  callback: EventHandler; // 事件回調函數
};

export class ShortCutKey {
  private _registeredKeysOn: Map<string, boolean> = new Map<string, boolean>();
  private _keyCallbackConfigs: KeyCallbackConfig[] = [];
  private _cacheConfigsByType: Map<KeyboardEventType, KeyCallbackConfig[]> =
    new Map();
  private _isListing: boolean = false;
  private _listenerHandles: ListnerHandle[] = [];
  private _initialOptions?: AddEventListenerOptions;

  constructor(
    initialConfig: KeyCallbackConfig | KeyCallbackConfig[],
    initialOptions?: AddEventListenerOptions
  ) {
    // Directly initialize _keyCallbackConfigs with the provided initialConfig
    this._keyCallbackConfigs = this._deepCloneKeyCallbackConfigs(initialConfig);
    this._initialOptions = initialOptions;
  }

  private _deepCloneKeyCallbackConfigs(
    config: KeyCallbackConfig | KeyCallbackConfig[]
  ): KeyCallbackConfig[] {
    const configsArray = Array.isArray(config) ? config : [config];
    return configsArray.map((c) => ({
      ...c,
      modifiers: c.modifiers ? [...c.modifiers] : undefined,
      // Ensure callback is also preserved correctly if it's part of a more complex object,
      // but typically callbacks are functions and are assigned by reference.
    }));
  }

  private _isShortcutMatch(
    event: KeyboardEvent,
    config: Pick<KeyCallbackConfig, "key" | "modifiers">
  ): boolean {
    if (event.key !== config.key) {
      return false;
    }
    const requiredModifiers = new Set(config.modifiers || []);
    return Object.values(MODIFIER_KEYS).every((modifier) => {
      const property = modifierKeyMap[modifier];
      const isPressed = event[property as keyof KeyboardEvent] as boolean;
      const isRequired = requiredModifiers.has(modifier);
      return isPressed === isRequired;
    });
  }

  private _updateKeysOn(keyboardEvent: KeyboardEvent): void {
    const isKeyDown = keyboardEvent.type === KeyboardEventType.KeyDown;

    if (this._registeredKeysOn.has(keyboardEvent.key)) {
      this._registeredKeysOn.set(keyboardEvent.key, isKeyDown);
      logger.debug(`${keyboardEvent.key} is ${isKeyDown ? "down" : "up"}`);
    }

    // Update modifier keys based on the event's state
    this._registeredKeysOn.set(MODIFIER_KEYS.Alt, keyboardEvent.altKey);
    this._registeredKeysOn.set(MODIFIER_KEYS.Control, keyboardEvent.ctrlKey);
    this._registeredKeysOn.set(MODIFIER_KEYS.Shift, keyboardEvent.shiftKey);
    this._registeredKeysOn.set(MODIFIER_KEYS.Meta, keyboardEvent.metaKey);
  }

  private _initializeRegisteredKeysOn(configs: KeyCallbackConfig[]): void {
    this._registeredKeysOn.clear();
    configs.forEach((cfg) => {
      this._registeredKeysOn.set(cfg.key, false);
      if (cfg.modifiers) {
        cfg.modifiers.forEach((modifier) => {
          this._registeredKeysOn.set(modifier, false);
        });
      }
    });
  }

  private _cacheKeyConfigsByType(): void {
    this._cacheConfigsByType.clear();
    this._cacheConfigsByType.set(KeyboardEventType.KeyDown, []);
    this._cacheConfigsByType.set(KeyboardEventType.KeyUp, []);

    this._keyCallbackConfigs.forEach((config) => {
      const typeCache = this._cacheConfigsByType.get(config.type);
      if (typeCache) {
        typeCache.push(config);
      } else {
        // Should not happen if initialized correctly
        this._cacheConfigsByType.set(config.type, [config]);
      }
    });
  }

  private _keyEventHandler = (event: EventWithId): void => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }

    // 防止重複觸發 (長按)
    if (event.repeat) return;

    const keyboardEvent = event as KeyboardEvent;
    // It's important to update key states before checking for matches,
    // especially for KeyUp, to correctly reflect the state when the key is released.
    this._updateKeysOn(keyboardEvent);

    const specificConfigs =
      this._cacheConfigsByType.get(keyboardEvent.type as KeyboardEventType) ||
      [];

    const matchedConfig = specificConfigs.find((cfg) =>
      this._isShortcutMatch(keyboardEvent, cfg)
    );

    if (matchedConfig) {
      // Call the callback for the matched configuration.
      // _updateKeysOn was already called, so the state is current.
      matchedConfig.callback(keyboardEvent as EventWithId);
    }
  };

  add(): this {
    if (this._isListing) {
      logger.warning("ShortCutKey.add: This instance is already listening.");
      return this; // Return this even on handled failure for chaining
    }
    if (typeof window === "undefined") {
      logger.warning(
        "ShortCutKey.add: window is not available in the current environment."
      );
      return this; // Return this even on handled failure for chaining
    }

    // Now, add uses the current _keyCallbackConfigs, which are set by constructor or swap.
    this._initializeRegisteredKeysOn(this._keyCallbackConfigs);
    this._cacheKeyConfigsByType();

    const keyDownListenerResult = addEventListener({
      target: window,
      type: KeyboardEventType.KeyDown,
      callback: this._keyEventHandler,
      options: this._initialOptions,
    });

    if (keyDownListenerResult.isErr()) {
      logger.error("ShortCutKey.add: Failed to add keydown listener.");
      // _isListing remains false, state indicates failure
      return this; // Return this even on handled failure for chaining
    }
    this._listenerHandles.push(keyDownListenerResult.unwrap());

    const keyUpListenerResult = addEventListener({
      target: window,
      type: KeyboardEventType.KeyUp,
      callback: this._keyEventHandler,
      options: this._initialOptions,
    });

    if (keyUpListenerResult.isErr()) {
      logger.error("ShortCutKey.add: Failed to add keyup listener.");
      this._listenerHandles.forEach((handle) => handle.remove()); // Clean up added keydown listener
      this._listenerHandles = [];
      // _isListing remains false, state indicates failure
      return this; // Return this even on handled failure for chaining
    }
    this._listenerHandles.push(keyUpListenerResult.unwrap());

    this._isListing = true;
    logger.debug(
      "ShortCutKey: Event listeners added and instance is now active."
    );
    return this;
  }

  remove(): this {
    if (!this._isListing) {
      logger.debug("ShortCutKey.remove: Instance is not currently listening.");
      // Even if not listening, the operation to ensure it's removed (or stays removed) can be seen as successful.
      // Or, one might argue this should also set an error state if strictness is required.
      // For chaining, returning `this` is consistent.
    }
    this._listenerHandles.forEach((listnerHandle) => listnerHandle.remove());
    this._listenerHandles = [];
    this._registeredKeysOn.clear();
    this._keyCallbackConfigs = [];
    this._cacheConfigsByType.clear();
    this._isListing = false; // Ensure state is correctly set to not listening

    logger.debug(
      "ShortCutKey: Event listeners removed and instance is no longer active."
    );
    return this;
  }

  swap(
    newConfig: KeyCallbackConfig | KeyCallbackConfig[]
  ): KeyCallbackConfig[] {
    const oldKeyCallbackConfigs = this._deepCloneKeyCallbackConfigs(
      this._keyCallbackConfigs
    );

    // Update current working configs
    this._keyCallbackConfigs = this._deepCloneKeyCallbackConfigs(newConfig);

    // Re-initialize based on new configs
    this._initializeRegisteredKeysOn(this._keyCallbackConfigs);
    this._cacheKeyConfigsByType();

    logger.debug("ShortCutKey: Configurations swapped.");
    return oldKeyCallbackConfigs;
  }

  isKeyOn(key: string): boolean | null {
    if (this._registeredKeysOn.has(key)) {
      return this._registeredKeysOn.get(key)!; // The key exists, so get() will not be undefined
    }
    return null;
  }

  get state(): boolean {
    return this._isListing;
  }

  get config(): {
    config: KeyCallbackConfig[];
    options?: AddEventListenerOptions;
  } {
    return {
      // Return a deep clone of the current _keyCallbackConfigs
      config: this._deepCloneKeyCallbackConfigs(this._keyCallbackConfigs),
      options: this._initialOptions, // Options are typically simple objects, shallow copy is fine
    };
  }
}
