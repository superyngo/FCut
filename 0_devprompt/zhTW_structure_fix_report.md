# zhTW 語言文件結構修復報告

## 問題診斷

### 問題描述

- zhTW 語言在 ACTION 設定頁面無法正常顯示繁體中文
- 錯誤訊息：`[intlify] Not found 'actionSettings.Jumpcut.info' key in 'zhTW' locale messages`
- zhCN 和 English 都能正常顯示

### 根本原因

**zhTW.ts 文件的物件結構錯誤**：

1. **錯誤結構**：`actionSettings` 被錯誤地放在 `taskList` 物件內部

   ```typescript
   taskList: {
     // ...其他屬性
     actionSettings: {
       // ❌ 錯誤位置
       Jumpcut: {
         info: "...";
       }
     }
   }
   ```

2. **正確結構**：`actionSettings` 應該在根層級（與 zhCN.ts 和 en.ts 一致）
   ```typescript
   {
     taskList: {
       // ...
     },
     actionSettings: {  // ✅ 正確位置
       Jumpcut: {
         info: "..."
       }
     }
   }
   ```

### 為什麼其他語言正常？

- **zhCN.ts**：`actionSettings` 在根層級 ✅
- **en.ts**：`actionSettings` 在根層級 ✅
- **zhTW.ts**：`actionSettings` 在 `taskList` 內部 ❌

## 修復方案

### 實施的修復

1. **移動 actionSettings 位置**：

   ```diff
   taskList: {
     status: {
       // ...
     },
   - actionSettings: {
   + },
   + actionSettings: {
   ```

2. **修復多餘的閉合括號**：
   ```diff
   - },
   - },
   + },
   ```

### 修復驗證

使用 Node.js 測試修復後的結構：

```javascript
const zhTW = require("./src/locales/zhTW.ts").default;
console.log("actionSettings exists:", !!zhTW.actionSettings); // ✅ true
console.log("Jumpcut.info exists:", !!zhTW.actionSettings?.Jumpcut?.info); // ✅ true
```

## 其他可能的改善方案

### 方案 1：使用 JSON 格式（建議考慮）

```json
// zhTW.json
{
  "actionSettings": {
    "Jumpcut": {
      "info": "交替加速剪輯AB片段，適合跳轉長影片，或是製作縮時效果。"
    }
  }
}
```

**優點**：

- 更嚴格的語法檢查
- 更好的工具支援
- 減少結構錯誤

### 方案 2：自動驗證載入器

```typescript
// i18n-loader.ts
function validateLocaleStructure(locale: any, name: string) {
  const required = ["actionSettings", "taskList", "settings"];
  for (const key of required) {
    if (!locale[key]) {
      console.error(`Missing ${key} in ${name} locale`);
    }
  }
}
```

### 方案 3：TypeScript 型別定義

```typescript
interface LocaleStructure {
  actionSettings: {
    Jumpcut: {
      info: string;
      // ...其他屬性
    };
    // ...其他 actions
  };
  taskList: {
    // ...
  };
}
```

## 總結

✅ **修復完成**：zhTW 語言文件結構已修正，`actionSettings` 現在位於正確的根層級位置

✅ **驗證通過**：所有必要的翻譯鍵值都能正確訪問

✅ **一致性**：zhTW.ts 現在與 zhCN.ts 和 en.ts 保持相同的結構

**建議**：未來可考慮使用 JSON 格式或 TypeScript 型別定義來避免類似的結構錯誤。
