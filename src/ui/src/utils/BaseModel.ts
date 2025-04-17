export abstract class BaseClass extends Object {
  [key: string]: any; // 允許任意屬性
  // Constructor is now minimal or empty
  protected _init(data: Record<string, any>): void {
    // 取得子類別實例上定義的所有屬性 (現在應該是完整的了)
    const expectedProperties = new Set(Object.keys(this));
    const dataKeys = Object.keys(data);
    const className = this.constructor.name;

    // 儲存屬性的初始值 (來自 class field 的預設值)
    const initialValues: Record<string, any> = {};
    expectedProperties.forEach((key) => {
      // 假設 _init 被呼叫時，this 持有 class field 的預設值
      initialValues[key] = (this as any)[key];
    });

    // 需求 2: 檢查 data 中是否有 class 未定義的額外屬性並將 data 中的值設定到 class 實例的屬性上
    for (const key of dataKeys) {
      if (!expectedProperties.has(key)) {
        throw new Error(
          `[${className}] Unexpected attribute error: Attribute '${key}' is not defined in the class.`
        );
      } else {
        (this as any)[key] = data[key];
      }
    }

    // 需求 3: 檢查 class 中未給預設值的屬性，是否在 data 中被提供
    for (const key of expectedProperties) {
      const currentValue = (this as any)[key];
      // 如果屬性仍然是 undefined 則表示缺少必要屬性
      if (currentValue === null) {
        throw new Error(
          `[${className}] Missing required attribute error: Attribute '${key}' must be provided.`
        );
      }
    }
  }
}
