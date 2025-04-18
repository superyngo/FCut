export const Required = Symbol("Required");

export abstract class BaseClass {
  [key: string]: any; // 允許任意屬性
  // Constructor is now minimal or empty
  protected _init(data: Record<string, any>): void {
    // 取得子類別實例上定義的所有屬性
    const expectedProperties = new Set(Object.keys(this));
    const dataKeys = Object.keys(data);
    const className = this.constructor.name;

    // 移除儲存初始值的邏輯，因為不再需要與初始值比較
    // const initialValues: Record<string, any> = {};
    // expectedProperties.forEach((key) => {
    //   initialValues[key] = (this as any)[key];
    // });

    // 需求 2: 檢查 data 中是否有 class 未定義的額外屬性並將 data 中的值設定到 class 實例的屬性上
    for (const key of dataKeys) {
      if (!expectedProperties.has(key)) {
        throw new Error(
          `[${className}] Unexpected attribute error: Attribute '${key}' is not defined in the class.`
        );
      }
      // 將 data 中的值賦給實例屬性
      (this as any)[key] = data[key];
    }

    // 需求 3: 檢查 class 中標記為 Required 的屬性，是否已被 data 中的值覆蓋
    for (const key of expectedProperties) {
      const currentValue = (this as any)[key];
      // 如果屬性值仍然是 Required enum 中的任何一個值，則表示 data 中未提供該必要屬性
      if (Required === currentValue) {
        throw new Error(
          `[${className}] Missing required attribute error: Attribute '${key}' must be provided.`
        );
      }
    }
  }
}
