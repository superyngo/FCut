import {
  ReflectMapToObject,
  ReflectObjectToMap,
  ReflectMapObject,
} from "../utils/proxy";

export abstract class BaseClass {
  _init(data: Record<PropertyKey, any> = {}): void {
    for (const [key, value] of Object.entries(data)) {
      (this as any)[key] = value;
    }
  }
  toMap() {
    return new Proxy(this, ReflectObjectToMap);
  }
  clone(): this {
    return new (this.constructor as new (
      data: Record<PropertyKey, any>
    ) => this)({ ...this });
  }
}

export class MapObject {
  constructor() {
    const map = new Map();
    const proxy = new Proxy(map, ReflectMapObject);
    // Object.setPrototypeOf(proxy, MapObject.prototype);
    return proxy;
  }
}

export class BaseMap extends Map {
  constructor() {
    super();
  }
  _init(data: Record<PropertyKey, any> = {}): any {
    for (const [key, value] of Object.entries(data)) {
      (this as any).set(key, value);
    }
    const proxy = new Proxy(this, ReflectMapObject);
    // Object.setPrototypeOf(proxy, MapObject.prototype);
    return proxy;
  }
  clone(): this {
    return new (this.constructor as new (
      data: Record<PropertyKey, any>
    ) => this)(this);
  }
}

class Test extends BaseMap {
  a: string = "";
  constructor(data: { a: string }) {
    super();
    return this._init(data);
  }
}
