export const ReflectMap: ProxyHandler<Map<any, any>> = {
  get(target: Map<any, any>, property: string | symbol, receiver: any) {
    // 特殊處理 methods 確保 this 指向 MapObject 實例
    if (property === "toJSON") {
      return () =>
        Object.fromEntries([...target.entries(), ...Object.entries(target)]);
    }
    if (property === "toString") {
      return () => "[object ProxyMap]";
    }
    if (property === "toMap") {
      return () => new Proxy(target, ReflectMap);
    }
    if (property === Symbol.iterator) {
      return target[Symbol.iterator].bind(target);
    }

    // Map getter
    if (property === "size") {
      return target.size;
    }

    if (property === "constructor") {
      return Reflect.get(target, property, receiver);
    }

    // Map methods
    if (typeof property === "string" && property in Map.prototype) {
      const mapMethod = property as keyof typeof Map.prototype;
      return (Map.prototype[mapMethod] as Function).bind(target);
    }

    // Defalut to return objects property
    return Reflect.get(target, property, receiver);
  },
};

export const ReflectMapToObject: ProxyHandler<Map<any, any>> = {
  // 讀取屬性時映射到 mapObj.get(key)
  get(target: Map<any, any>, property: string | symbol) {
    if (typeof property === "string") {
      return target.get(property);
    }
    return undefined;
  },

  // 設置屬性時映射到 mapObj.set(key, value)
  set(target: Map<any, any>, property: string | symbol, value: any) {
    if (typeof property === "string") {
      target.set(property, value);
      return true; // 表示設置成功
    }
    return false; // 表示設置失敗
  },

  // 檢查屬性是否存在時映射到 mapObj.has(key)
  has(target: Map<any, any>, property: string | symbol) {
    if (typeof property === "string") {
      return target.has(property);
    }
    return false;
  },

  // 刪除屬性時映射到 mapObj.delete(key)
  deleteProperty(target: Map<any, any>, property: string | symbol) {
    if (typeof property === "string") {
      return target.delete(property); // 返回刪除是否成功
    }
    return false;
  },

  // 返回所有屬性名，映射到 mapObj.keys()
  ownKeys(target: Map<any, any>) {
    return Array.from(target.keys());
  },

  // 提供屬性描述符，支援 Object.getOwnPropertyDescriptor()
  getOwnPropertyDescriptor(target: Map<any, any>, property: string | symbol) {
    if (typeof property === "string" && target.has(property)) {
      return {
        value: target.get(property),
        writable: true, // 可寫
        enumerable: true, // 可枚舉
        configurable: true, // 可配置
      };
    }
    return undefined;
  },

  // 設置原型為 Object.prototype，使其行為像普通對象
  getPrototypeOf(target: Map<any, any>) {
    return Object.prototype;
  },

  // 禁止修改原型
  setPrototypeOf(target: Map<any, any>, proto: any) {
    return false;
  },

  // 表示對象是可擴展的
  isExtensible(target: Map<any, any>) {
    return true;
  },

  // 禁止阻止擴展
  preventExtensions(target: Map<any, any>) {
    return false;
  },
};

// export const ReflectObjectToMap: ProxyHandler<object> = {
//   get(target: object, property: string | symbol, receiver: any) {
//     // 定義 Map 的方法和屬性
//     const mapMethods: Record<string, Function> = {
//       get: (key: string) => target[key as keyof typeof target],
//       set: (key: string, value: any) => {
//         target[key as keyof typeof target] = value;
//         return receiver; // 支持鏈式調用
//       },
//       has: (key: string) => key in target,
//       delete: (key: string) => delete target[key as keyof typeof target],
//       clear: () => {
//         for (const key in target) {
//           delete target[key as keyof typeof target];
//         }
//       },
//       keys: () => Object.keys(target)[Symbol.iterator](),
//       values: () => Object.values(target)[Symbol.iterator](),
//       entries: () => Object.entries(target)[Symbol.iterator](),
//       forEach: (callback: Function) => {
//         for (const key in target) {
//           callback(target[key as keyof typeof target], key, receiver);
//         }
//       },
//       size: {
//         get: () => Object.keys(target).length,
//       },
//       toString: () => {
//         const entries = Object.entries(target).map(
//           ([k, v]) => `"${k}" => ${v}`
//         );
//         return `Map(${entries.length}) {${entries.join(", ")}}`;
//       },
//     };

//     // 處理 Symbol.toStringTag
//     if (property === Symbol.toStringTag) {
//       return "Map";
//     }

//     // 處理 Symbol.iterator
//     if (property === Symbol.iterator) {
//       return mapMethods.entries;
//     }

//     // 處理 Map 的方法和屬性
//     if (typeof property === "string" && property in mapMethods) {
//       const method = mapMethods[property];
//       if (property === "size") {
//         return method.get(); // size 是屬性，返回其值
//       } else {
//         return method.bind(receiver); // 其他是方法，返回綁定函數
//       }
//     }

//     return undefined; // 未定義的屬性返回 undefined
//   },

//   has(target: object, property: string | symbol) {
//     // 處理 in 運算符
//     const mapMethods = [
//       "get",
//       "set",
//       "has",
//       "delete",
//       "clear",
//       "keys",
//       "values",
//       "entries",
//       "forEach",
//       "size",
//       "toString",
//     ];
//     if (typeof property === "string" && mapMethods.includes(property)) {
//       return true;
//     }
//     if (property === Symbol.iterator || property === Symbol.toStringTag) {
//       return true;
//     }
//     return false;
//   },

//   getOwnPropertyDescriptor(target: object, property: string | symbol) {
//     // 提供 Map 方法和屬性的描述符
//     const mapMethods = [
//       "get",
//       "set",
//       "has",
//       "delete",
//       "clear",
//       "keys",
//       "values",
//       "entries",
//       "forEach",
//       "size",
//       "toString",
//     ];
//     if (typeof property === "string" && mapMethods.includes(property)) {
//       return {
//         configurable: true,
//         enumerable: false,
//         writable: false,
//         value: ReflectObjectToMap.get!(target, property, target),
//       };
//     }
//     if (property === Symbol.iterator || property === Symbol.toStringTag) {
//       return {
//         configurable: true,
//         enumerable: false,
//         writable: false,
//         value: ReflectObjectToMap.get!(target, property, target),
//       };
//     }
//     return undefined;
//   },

//   ownKeys(target: object) {
//     // 返回 Map 的方法和屬性
//     return [
//       "get",
//       "set",
//       "has",
//       "delete",
//       "clear",
//       "keys",
//       "values",
//       "entries",
//       "forEach",
//       "size",
//       "toString",
//       Symbol.iterator,
//       Symbol.toStringTag,
//     ];
//   },
// };

export const ReflectMapObject: ProxyHandler<Map<any, any>> = {
  get(target, property, receiver) {
    // 特殊處理 methods 確保 this 指向 MapObject 實例
    if (property === "toJSON") {
      return () => Object.fromEntries(target.entries());
    }
    if (property === "toString") {
      return () => "[object MapObject]";
    }
    if (property === "toMap") {
      return () => new Proxy(target, ReflectMap);
    }
    // if (property === "setObject") {
    //   return (_key: string, _property: any) => Reflect.set(target, _key, _property);
    // }

    if (property === Symbol.iterator) {
      return target[Symbol.iterator].bind(target);
    }

    if (property === "size") {
      return target.size;
    }

    if (property === "constructor") {
      return Reflect.get(target, property, receiver);
    }

    // Return Map methods in Object.getOwnPropertyNames(Map.prototype) exluding "size" and "constructor"
    if (typeof property === "string" && property in Map.prototype) {
      const mapMethod = property as keyof typeof Map.prototype;
      return (Map.prototype[mapMethod] as Function).bind(target);
    }

    // Return instance properties
    if (property in target) {
      return Reflect.get(target, property, receiver);
    }

    // Mapping object get to Map get
    return target.get(property);
  },
  set(target, property, value, receiver) {
    // Mapping object set to Map set
    target.set(property, value);
    return true;
  },
  has(target, property) {
    // Mapping Object in behavior to Map.have
    return target.has(property);
  },
  deleteProperty(target, property) {
    // Mapping Object delter behavior to Map.delete
    if (target.has(property)) {
      target.delete(property);
      return true;
    }
    return false;
  },
  ownKeys(target) {
    const keys: (string | symbol)[] = [];
    for (const key of target.keys()) {
      if (typeof key === "string" || typeof key === "symbol") {
        keys.push(key);
      }
    }
    return keys;
  },
  getOwnPropertyDescriptor(target, property) {
    if (target.has(property)) {
      return {
        value: target.get(property),
        writable: true,
        enumerable: true,
        configurable: true,
      };
    }
    return undefined;
  },
  defineProperty(target, property, descriptor) {
    if (descriptor.value !== undefined) {
      target.set(property, descriptor.value);
    }
    return true;
  },
};
