type EventHandler = (event: Event) => void;

interface ListenerConfig {
  element: EventTarget;
  type: string;
  userHandler: EventHandler;
  wrappedHandler: EventHandler;
  options?: AddEventListenerOptions;
}

interface EventQueueEntry {
  queue: Event[];
  ticking: boolean;
  handler: EventHandler;
  priority: number;
}

interface ThrottlerOptions {
  maxBufferSize?: number;
  maxFlushPerFrame?: number;
  useRAF?: boolean;
  debounceFn?: (fn: () => void) => void;
  throttleFn?: (fn: () => void) => void;
  flushAllAtOnce?: boolean; // 是否所有 queue 一起 flush
}

export class AdvancedEventQueueThrottler {
  private queues: Map<string, EventQueueEntry> = new Map();
  private listeners: ListenerConfig[] = [];
  private options: ThrottlerOptions;
  private paused = false;

  constructor(options: ThrottlerOptions = {}) {
    this.options = {
      useRAF: options.useRAF ?? true,
      maxBufferSize: options.maxBufferSize ?? Infinity,
      maxFlushPerFrame: options.maxFlushPerFrame ?? Infinity,
      flushAllAtOnce: options.flushAllAtOnce ?? false,
      debounceFn: options.debounceFn,
      throttleFn: options.throttleFn,
    };
  }

  addListener(
    element: EventTarget,
    type: string,
    handler: EventHandler,
    options: AddEventListenerOptions = { passive: true },
    priority = 0
  ) {
    const key = type;

    const wrappedHandler = (event: Event) => {
      if (this.paused) return;

      const queueEntry = this.queues.get(key) ?? {
        queue: [],
        ticking: false,
        handler,
        priority,
      };

      if (queueEntry.queue.length < (this.options.maxBufferSize || Infinity)) {
        queueEntry.queue.push(event);
      }

      if (!queueEntry.ticking) {
        queueEntry.ticking = true;

        const flush = () =>
          this.options.flushAllAtOnce
            ? this.flushAllQueues()
            : this.flushQueue(key);

        if (this.options.useRAF) {
          requestAnimationFrame(flush);
        } else if (this.options.debounceFn) {
          this.options.debounceFn(flush);
        } else if (this.options.throttleFn) {
          this.options.throttleFn(flush);
        } else {
          flush();
        }
      }

      this.queues.set(key, queueEntry);
    };

    element.addEventListener(type, wrappedHandler, options);
    this.listeners.push({
      element,
      type,
      userHandler: handler,
      wrappedHandler,
      options,
    });
  }

  private flushQueue(type: string) {
    const entry = this.queues.get(type);
    if (!entry) return;

    let count = 0;
    while (
      entry.queue.length > 0 &&
      count < (this.options.maxFlushPerFrame || Infinity)
    ) {
      const event = entry.queue.shift();
      if (event) entry.handler(event);
      count++;
    }

    entry.ticking = false;
  }

  private flushAllQueues() {
    const sorted = [...this.queues.entries()].sort(
      (a, b) => b[1].priority - a[1].priority
    );

    for (const [type, entry] of sorted) {
      let count = 0;
      while (
        entry.queue.length > 0 &&
        count < (this.options.maxFlushPerFrame || Infinity)
      ) {
        const event = entry.queue.shift();
        if (event) entry.handler(event);
        count++;
      }
      entry.ticking = false;
    }
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  removeAllListeners() {
    for (const { element, type, wrappedHandler, options } of this.listeners) {
      element.removeEventListener(type, wrappedHandler, options);
    }
    this.listeners = [];
    this.queues.clear();
  }
}
