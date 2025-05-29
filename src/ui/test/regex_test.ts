// 測試 RegExp 序列化和反序列化
import { InputText } from "../models/elements";

console.log("=== RegExp 序列化和反序列化測試 ===");

// 創建一個 InputText 實例
const originalInputText = new InputText({
  label: "Test",
  value: "00:00:000",
  regexValidator: /^\d{0,2}:\d{0,2}:\d{0,3}$/,
});

console.log("原始 regexValidator:", originalInputText.regexValidator);
console.log(
  "原始 regexValidator.source:",
  originalInputText.regexValidator?.source
);
console.log(
  "原始 regexValidator.flags:",
  originalInputText.regexValidator?.flags
);

// 序列化
const serialized = JSON.stringify(originalInputText);
console.log("序列化結果:", serialized);

// 反序列化
const parsed = JSON.parse(serialized);
console.log("解析後的 regexValidator:", parsed.regexValidator);

// 重新實例化
const recreatedInputText = new InputText(parsed);
console.log("重建後 regexValidator:", recreatedInputText.regexValidator);
console.log(
  "重建後 regexValidator.source:",
  recreatedInputText.regexValidator?.source
);
console.log(
  "重建後 regexValidator.flags:",
  recreatedInputText.regexValidator?.flags
);

// 測試功能
const testValue = "00:00:123";
console.log(`測試值 "${testValue}":`);
console.log("原始驗證:", originalInputText.regexValidator?.test(testValue));
console.log("重建驗證:", recreatedInputText.regexValidator?.test(testValue));

console.log("=== 測試完成 ===");
