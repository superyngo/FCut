import { ReflectMapObject } from "../utils/proxy";

export abstract class BaseClass {
  _init(data: Record<PropertyKey, any> = {}): void {
    for (const [key, value] of Object.entries(data)) {
      (this as any)[key] = value;
    }
  }
  // toMap() {
  //   return new Proxy(this, ReflectObjectToMap);
  // }
  clone(): this {
    return new (this.constructor as new (
      data: Record<PropertyKey, any>
    ) => this)({ ...this });
  }
  toString() {
    return `[object ${this.constructor.name}]`;
  }
}

export class BaseMap extends Map {
  constructor() {
    super();
  }
  _init(data: Record<PropertyKey, any> = {}): void {
    for (const [key, value] of Object.entries(data)) {
      (this as Map<PropertyKey, any>).set(key, value);
    }
  }
  toMapObject() {
    return new Proxy(this, ReflectMapObject);
  }
  clone(): this {
    return new (this.constructor as new (
      data: Record<PropertyKey, any>
    ) => this)(Object.fromEntries(this.entries()));
  }
  toJSON() {
    return Object.fromEntries(this.entries());
  }
  toString() {
    return `[object ${this.constructor.name}]`;
  }
}

type ExampleData = { a: number };
class Example extends BaseMap {
  constructor(data: ExampleData) {
    super();
    let defalut = { a: 1 };
    this._init({ ...defalut, ...data });
  }
}

export class MapObject extends Map {
  constructor(entries: any[] = []) {
    super();
    for (const [key, value] of entries) {
      this.set(key, value);
    }
    return new Proxy(this, ReflectMapObject);
  }
}
// class MapObject1 {
//   #map = new Map();

//   constructor(entries: any[] = []) {
//     for (const [key, value] of entries) {
//       this.#map.set(key, value);
//     }
//     return new Proxy(this, {
//       get(target, prop, receiver) {
//         // 特殊處理 toJSON，確保 this 指向 MapObject 實例
//         if (prop === "toJSON") {
//           return target.toJSON.bind(target);
//         }
//         if (prop === "size") {
//           return target.#map.size;
//         }
//         if (typeof prop === "string" && prop in Map.prototype) {
//           const mapMethod = prop as keyof Map<any, any>;
//           return (...args: any[]) =>
//             (target.#map[mapMethod] as Function).apply(target.#map, args);
//         }
//         if (prop in target) {
//           return Reflect.get(target, prop, receiver);
//         }
//         return target.#map.get(prop);
//       },
//       set(target, prop, value, receiver) {
//         target.#map.set(prop, value);
//         return true;
//       },
//       has(target, prop) {
//         return target.#map.has(prop);
//       },
//       deleteProperty(target, prop) {
//         if (target.#map.has(prop)) {
//           target.#map.delete(prop);
//           return true;
//         }
//         return false;
//       },
//       ownKeys(target) {
//         return [...target.#map.keys()].filter(
//           (key) => typeof key === "string" || typeof key === "symbol"
//         );
//       },
//       getOwnPropertyDescriptor(target, prop) {
//         if (target.#map.has(prop)) {
//           return {
//             value: target.#map.get(prop),
//             writable: true,
//             enumerable: true,
//             configurable: true,
//           };
//         }
//         return undefined;
//       },
//       defineProperty(target, prop, descriptor) {
//         if (descriptor.value !== undefined) {
//           target.#map.set(prop, descriptor.value);
//         }
//         return true;
//       },
//     });
//   }

//   toJSON() {
//     return Object.fromEntries(this.#map.entries());
//   }

//   toString() {
//     return "[object MapObject]";
//   }

//   [Symbol.iterator]() {
//     return this.#map[Symbol.iterator]();
//   }
// }

// class MapObject2Js extends Map {
//     constructor(entries = []) {
//       super();
//       for (const [key, value] of entries) {
//         this.set(key, value);
//       }
//       return new Proxy(this, {
//         get(target, prop, receiver) {
//           // Special handling for toJSON, ensure "this" points to MapObject instance
//           if (prop === "toJSON") {
//             return target.toJSON.bind(target);
//           }
//           if (prop === "size") {
//             return target.size;
//           }
//           if (typeof prop === "string" && prop in Map.prototype) {
//             return (...args) =>
//               target[prop].apply(target, args);
//           }
//           if (prop in target) {
//             return Reflect.get(target, prop, receiver);
//           }
//           return target.get(prop);
//         },
//         set(target, prop, value, receiver) {
//           target.set(prop, value);
//           return true;
//         },
//         has(target, prop) {
//           return target.has(prop);
//         },
//         deleteProperty(target, prop) {
//           if (target.has(prop)) {
//             target.delete(prop);
//             return true;
//           }
//           return false;
//         },
//         ownKeys(target) {
//           const keys = [];
//           for (const key of target.keys()) {
//             if (typeof key === "string" || typeof key === "symbol") {
//               keys.push(key);
//             }
//           }
//           return keys;
//         },
//         getOwnPropertyDescriptor(target, prop) {
//           if (target.has(prop)) {
//             return {
//               value: target.get(prop),
//               writable: true,
//               enumerable: true,
//               configurable: true,
//             };
//           }
//           return undefined;
//         },
//         defineProperty(target, prop, descriptor) {
//           if (descriptor.value !== undefined) {
//             target.set(prop, descriptor.value);
//           }
//           return true;
//         },
//       });
//     }

//     toJSON() {
//       return Object.fromEntries(this.entries());
//     }

//     toString() {
//       return "[object MapObject]";
//     }

//     toMap() {
//       return new Map(this.entries());
//     }

//     [Symbol.iterator]() {
//       return Map.prototype[Symbol.iterator].call(this);
//     }
// }
