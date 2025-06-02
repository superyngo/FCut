import { pywebview } from "../services/pywebview";

export class logger {
  // 新增顏色常量
  private static COLORS = {
    DEBUG: "color:rgb(148, 170, 250)", // 灰色
    ERROR: "color: #FF0000; font-weight: bold", // 紅色加粗
    WANING: "color: #FFA500", // 橙色
    INFO: "color:rgb(92, 244, 107)", // 藍色
  };

  /**
   * 檢查屬性是否為 getter 或 setter
   */
  private static checkGetter(obj: any, prop: string): boolean {
    const descriptor = Object.getOwnPropertyDescriptor(
      obj,
      prop
    ) as PropertyDescriptor;
    return descriptor && typeof descriptor.get === "function";
  }

  /**
   * 檢查屬性是否為 setter
   */
  private static checkSetter(obj: any, prop: string): boolean {
    const descriptor = Object.getOwnPropertyDescriptor(
      obj,
      prop
    ) as PropertyDescriptor;
    return descriptor && typeof descriptor.set === "function";
  }

  /**
   * 序列化物件，處理特殊情況
   */
  private static smartStringify(
    obj: any,
    depth: number = 0,
    maxDepth: number = 2
  ): string {
    // 防止循環引用和過深遞迴
    if (depth > maxDepth) return "[Object]";
    if (obj === null) return "null";
    if (obj === undefined) return "undefined";

    // 處理基本類型
    if (typeof obj !== "object" && typeof obj !== "function") {
      return String(obj);
    }

    // 處理函數 - 顯示函數定義文字
    if (typeof obj === "function") {
      try {
        const funcStr = Function.prototype.toString.call(obj);
        // 移除可能的註釋並限制長度
        const cleanFuncStr = funcStr
          .replace(/\/\*[\s\S]*?\*\//g, "") // 移除塊註釋
          .replace(/\/\/.*$/gm, "") // 移除行註釋
          .trim();

        // 如果函數太長，則截斷
        const maxFuncLength = 200;
        if (cleanFuncStr.length > maxFuncLength) {
          return `[Function: ${
            obj.name || "anonymous"
          }] ${cleanFuncStr.substring(0, maxFuncLength)}...`;
        }
        return `[Function: ${obj.name || "anonymous"}] ${cleanFuncStr}`;
      } catch (e) {
        // 若無法獲取函數定義，則回退到之前的行為
        return `[Function: ${obj.name || "anonymous"}]`;
      }
    }

    // 處理 Map
    if (obj instanceof Map) {
      const entries = Array.from(obj.entries()).map(
        ([k, v]) =>
          `${this.smartStringify(
            k,
            depth + 1,
            maxDepth
          )}: ${this.smartStringify(v, depth + 1, maxDepth)}`
      );
      return `Map(${obj.size}) {${
        entries.length ? " " + entries.join(", ") + " " : ""
      }}`;
    }

    // 處理陣列
    if (Array.isArray(obj)) {
      const items = obj.map((item) =>
        this.smartStringify(item, depth + 1, maxDepth)
      );
      return `[${items.join(", ")}]`;
    }
    // 處理 RegExp
    if (obj instanceof RegExp) {
      return `RegExp(${obj.source}, ${obj.flags})`;
    }

    // 處理其他物件
    try {
      const props = Object.getOwnPropertyNames(obj);
      const result: string[] = [];

      for (const prop of props) {
        // 檢查是否是 getter 或 setter
        const isGetter = this.checkGetter(obj, prop);
        const isSetter = this.checkSetter(obj, prop);

        if (isGetter && isSetter) {
          result.push(`${prop}: [Getter/Setter]`);
        } else if (isGetter) {
          result.push(`${prop}: [Getter]`);
        } else if (isSetter) {
          result.push(`${prop}: [Setter]`);
        } else {
          try {
            const value = obj[prop];
            // 處理函數
            if (typeof value === "function") {
              try {
                const funcStr = Function.prototype.toString.call(value);
                // 移除可能的註釋並限制長度
                const cleanFuncStr = funcStr
                  .replace(/\/\*[\s\S]*?\*\//g, "") // 移除塊註釋
                  .replace(/\/\/.*$/gm, "") // 移除行註釋
                  .trim();

                // 如果函數太長，則截斷
                const maxFuncLength = 150;
                if (cleanFuncStr.length > maxFuncLength) {
                  result.push(
                    `${prop}: [Function: ${
                      value.name || "anonymous"
                    }] ${cleanFuncStr.substring(0, maxFuncLength)}...`
                  );
                } else {
                  result.push(
                    `${prop}: [Function: ${
                      value.name || "anonymous"
                    }] ${cleanFuncStr}`
                  );
                }
              } catch (e) {
                result.push(
                  `${prop}: [Function: ${value.name || "anonymous"}]`
                );
              }
            } else {
              result.push(
                `${prop}: ${this.smartStringify(value, depth + 1, maxDepth)}`
              );
            }
          } catch (e) {
            result.push(`${prop}: [Error: ${(e as Error).message}]`);
          }
        }
      }

      return `{${result.length ? " " + result.join(", ") + " " : ""}}`;
    } catch (e) {
      return `[Error: ${(e as Error).message}]`;
    }
  }

  private static formatMessage(...args: any[]): string {
    return args
      .map((arg) => {
        if (arg === null || arg === undefined) {
          return String(arg);
        }
        if (typeof arg === "object" || typeof arg === "function") {
          return this.smartStringify(arg);
        }
        return String(arg);
      })
      .join(" ");
  }
  static debug(...args: any[]): void {
    const message = this.formatMessage(...args);
    console.log(
      `%c[DEBUG] ${new Date().toISOString()}: ${message}`,
      this.COLORS.DEBUG
    );
    if (pywebview?.api?.logger_debug) {
      pywebview.api.logger_debug(message);
    }
  }

  static error(...args: any[]): void {
    const message = this.formatMessage(...args);
    console.log(
      `%c[ERROR] ${new Date().toISOString()}: ${message}`,
      this.COLORS.ERROR
    );
    if (pywebview?.api?.logger_error) {
      pywebview.api.logger_error(message);
    }
  }

  static warning(...args: any[]): void {
    const message = this.formatMessage(...args);
    console.log(
      `%c[WANING] ${new Date().toISOString()}: ${message}`,
      this.COLORS.WANING
    );
    if (pywebview?.api?.logger_warning) {
      pywebview.api.logger_warning(message);
    }
  }

  static info(...args: any[]): void {
    const message = this.formatMessage(...args);
    console.log(
      `%c[INFO] ${new Date().toISOString()}: ${message}`,
      this.COLORS.INFO
    );
    if (pywebview?.api?.logger_info) {
      pywebview.api.logger_info(message);
    }
  }
}
