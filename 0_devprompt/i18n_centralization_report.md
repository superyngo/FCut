# i18n 集中管理重構報告

## 概述

成功實現了 i18n 翻譯函數的集中管理，將 `t` 函數整合到 `useAppState` store 中，讓所有組件可以統一透過 `useAppState` 使用翻譯功能，無需各自導入 `useI18n`。

## 修改內容

### 1. stores.ts 主要修改

#### 修改位置：`useAppState` store

```typescript
// 修改前
const { locale: i18nLocale } = useI18n();

// 修改後
const { locale: i18nLocale, t } = useI18n();

// 在 return 中添加
return {
  // ...existing exports...
  t, // 導出翻譯函數
};
```

### 2. 組件修改清單

已完成修改的組件：

#### ✅ MessageBar.vue

```typescript
// 修改前
import { useI18n } from "vue-i18n";
const { t } = useI18n();

// 修改後
import { useAppState } from "../stores/stores";
const appState = useAppState();
const { t } = appState;
```

#### ✅ TaskSettingsForm.vue

```typescript
// 修改前
import { useI18n } from "vue-i18n";
const { t } = useI18n();

// 修改後
import { useAppState } from "../stores/stores";
const appState = useAppState();
const { t } = appState;
```

#### ✅ SpeedupSettings.vue

```typescript
// 修改前
import { useI18n } from "vue-i18n";
const { t } = useI18n();

// 修改後
import { useAppState } from "../../stores/stores";
const appState = useAppState();
const { t } = appState;
```

#### ✅ TaskList.vue

```typescript
// 修改前
import { useTasks, useModalStore, useCallBackRedistry } from "../stores/stores";

// 修改後
import {
  useTasks,
  useModalStore,
  useCallBackRedistry,
  useAppState,
} from "../stores/stores";
const appState = useAppState();
const { t } = appState;
```

#### ✅ TopBar.vue

```typescript
// 已有 useAppState 導入，只需添加：
const { t } = appState;
```

#### ✅ AppModals.vue

```typescript
// 修改前
import { useModalStore, useTasks } from "../stores/stores";

// 修改後
import { useModalStore, useTasks, useAppState } from "../stores/stores";
const appState = useAppState();
const { t } = appState;
```

#### ✅ MenuOptions.vue

```typescript
// 修改前
import { useModalStore } from "../stores/stores";

// 修改後
import { useModalStore, useAppState } from "../stores/stores";
const appState = useAppState();
const { t } = appState;
```

#### ✅ SettingsPage.vue

```typescript
// 已有 useAppState 導入，只需添加：
const { t } = appState;
```

### 3. 待處理的組件

以下組件仍使用 `$t` 語法，但尚未更新（可在後續需要時處理）：

- AboutPage.vue
- HelpPage.vue
- 各種 action-settings 組件（CutSettings.vue, CutSilenceSettings.vue 等）

## 優點

1. **集中管理**：所有 i18n 相關邏輯集中在 `useAppState` 中
2. **減少重複**：組件不需要各自導入 `useI18n`
3. **統一入口**：所有翻譯都通過同一個入口
4. **更好的維護性**：如需修改 i18n 邏輯，只需在一個地方修改
5. **保持向下兼容**：模板中的 `$t` 語法仍可正常工作

## 使用方式

### 在組件中使用

```typescript
// script setup
import { useAppState } from "../stores/stores";

const appState = useAppState();
const { t } = appState; // 獲取翻譯函數

// 在 JavaScript 中使用
const message = t("some.translation.key");

// 在模板中仍可使用 $t 語法
// <template>{{ $t('some.key') }}</template>
```

### 舊的使用方式（已不需要）

```typescript
// 不再需要這樣做
import { useI18n } from "vue-i18n";
const { t } = useI18n();
```

## 測試結果

✅ 所有修改的文件都通過了編譯檢查，沒有發現錯誤
✅ 翻譯功能正常工作
✅ 語言切換功能正常

## 總結

這次重構成功實現了 i18n 翻譯函數的集中管理，提升了代碼的可維護性和一致性。組件現在可以統一通過 `useAppState` 獲取翻譯函數，無需各自導入 `useI18n`，符合了您的需求。
