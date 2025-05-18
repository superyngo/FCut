# keyEvents.ts 重構遷移指南

## 結構變更概述

本次重構對 `keyEvents.ts` 模塊進行了以下主要變更：

1. 將 `KeyCallbackConfig` 類型定義中的 `id` 屬性替換為 `key` 屬性
2. 更改 `_keyEventsState.keyConfigs` 的結構，從 `Map<string, KeyCallbackConfig[]>` 改為 `Map<string, KeyCallbackConfig>`
3. 修改 `onKeys` 函數，接受 `KeyCallbackConfig[]` 數組作為輸入，而非舊版的 `Record<string, KeyCallbackConfig | KeyCallbackConfig[]>`
4. 新增 `viewKeyCallbackConfig` 輔助函數及緩存機制，優化查詢效率

## 使用變更

### 舊版本 API 使用方式

```typescript
import { onKeys, MODIFIER_KEYS } from "./utils/keyEvents";

const listenerHandle = onKeys({
  a: {
    type: "onPress",
    callback: () => console.log("按下了 A"),
    modifiers: [MODIFIER_KEYS.Control],
    preventDefault: true,
  },
  b: [
    {
      type: "onPress",
      callback: () => console.log("按下了 B"),
    },
    {
      type: "onRelease",
      callback: () => console.log("釋放了 B"),
    },
  ],
});

// 移除監聽器
listenerHandle();
```

### 新版本 API 使用方式

```typescript
import { onKeys, MODIFIER_KEYS } from "./utils/keyEvents";

const listenerHandle = onKeys([
  {
    key: "a",
    type: "onPress",
    callback: () => console.log("按下了 A"),
    modifiers: [MODIFIER_KEYS.Control],
    preventDefault: true,
  },
  {
    key: "b",
    type: "onPress",
    callback: () => console.log("按下了 B"),
  },
  {
    key: "b",
    type: "onRelease",
    callback: () => console.log("釋放了 B"),
  },
]);

// 移除監聽器 (與舊版本相同)
listenerHandle();
```

## 遷移步驟

1. 在所有使用 `onKeys` 的地方，將按鍵配置從對象格式改為數組格式
2. 將所有按鍵名稱從鍵值對中的「鍵」移動到每個 `KeyCallbackConfig` 物件中的 `key` 屬性
3. 移除所有 `KeyCallbackConfig` 中手動設置的 `id` 屬性，因為新版本不再使用此屬性
4. 使用新的 `viewKeyCallbackConfig` 函數代替舊有的按鍵查詢邏輯

## 代碼變更範例

### 範例 1：基本按鍵配置

舊版本:

```typescript
onKeys({
  Space: { type: "onPress", callback: handlePlayPause },
});
```

新版本:

```typescript
onKeys([{ key: "Space", type: "onPress", callback: handlePlayPause }]);
```

### 範例 2：多個按鍵配置

舊版本:

```typescript
onKeys({
  ArrowLeft: { type: "onPress", callback: prevFrame },
  ArrowRight: { type: "onPress", callback: nextFrame },
});
```

新版本:

```typescript
onKeys([
  { key: "ArrowLeft", type: "onPress", callback: prevFrame },
  { key: "ArrowRight", type: "onPress", callback: nextFrame },
]);
```

### 範例 3：同一按鍵多種事件

舊版本:

```typescript
onKeys({
  a: [
    { type: "onPress", callback: handlePress },
    { type: "onRelease", callback: handleRelease },
  ],
});
```

新版本:

```typescript
onKeys([
  { key: "a", type: "onPress", callback: handlePress },
  { key: "a", type: "onRelease", callback: handleRelease },
]);
```

## 好處

1. 更扁平的數據結構，便於維護和擴展
2. 配置邏輯更統一，無需處理嵌套數組
3. 優化的按鍵查詢，提高性能
4. 代碼更簡潔，更易於理解

## 注意事項

1. 確保所有使用 `keyEvents.ts` 模塊的代碼都已更新
2. 特別注意處理同一按鍵的多個事件處理邏輯
3. 如有自定義查詢按鍵配置的邏輯，請改用新的 `viewKeyCallbackConfig` 函數
