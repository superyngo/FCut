type ObjectKey = string | symbol | number | `${string}_event`;

export abstract class BaseClass<K, V> {
  _init(data: Record<ObjectKey, any> = {}) {
    for (const [key, value] of Object.entries(data)) {
      (this as any)[key] = value;
    }
  }
  toMap(): Map<ObjectKey, V> {
    return new Map(Object.entries(this.clone()));
  }
  clone(): BaseClass<K, V> {
    return structuredClone(this);
  }
}

export class BaseMap<K, V> extends Map<K, V> {
  constructor() {
    super();
  }
  _init(data: Record<ObjectKey, any> = {}) {
    for (const [key, value] of Object.entries(data)) {
      (this as any).set(key, value);
    }
  }
  toObject(): Record<ObjectKey, V> {
    return Object.fromEntries(structuredClone(this).entries());
  }
  clone(): BaseMap<K, V> {
    return structuredClone(this);
  }
}
