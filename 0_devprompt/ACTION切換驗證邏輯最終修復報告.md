# ACTION 切換驗證邏輯最終修復報告

## 修復日期

2025 年 6 月 2 日

## 問題描述

根據用戶反饋，ACTION 切換驗證邏輯存在問題：

- 當有錯誤時嘗試切換 ACTION 會成功，但切換回 CUT 時會顯示錯誤訊息
- 需要實現類似保存按鈕的行為：有錯誤時阻止切換，修復錯誤後允許切換

## 問題分析

1. **根本原因**: 之前的實現試圖在組件切換過程中保存舊組件的引用，但 Vue 的響應式系統會在組件重新渲染時銷毀舊的組件實例
2. **設計問題**: `validatePrevious()` 和 `getPreviousSettings()` 方法依賴於保存的組件引用，這在 Vue 的生命週期中不穩定
3. **時序問題**: 組件引用在 watch 觸發時可能已經無效

## 解決方案

採用**直接驗證當前組件**的策略，而不是嘗試保存和驗證舊組件引用：

### 1. TaskSettingsForm.vue 的關鍵修改

```vue
watch(() => tempTask.value?.renderMethod, async (newMethod, oldMethod) => { //
在切換之前檢查當前顯示的組件（舊ACTION） if (previousRenderMethod &&
previousRenderMethod !== "" && actionSettingsRef.value) { //
直接驗證當前顯示的ACTION組件 const validation =
actionSettingsRef.value.validate(); if (!validation.valid) { //
驗證失敗，阻止切換 const errorMessage = `請先修復 ${previousRenderMethod}
的設定錯誤：${validation.message}`; validationError.value = errorMessage; //
恢復到之前的方法，阻止切換 isRestoring = true; nextTick(() => { if
(tempTask.value) { tempTask.value.renderMethod = previousRenderMethod as
ACTIONS; } }); return; } else { // 驗證成功，保存當前設定 const
formattedSettings = actionSettingsRef.value.getSettings(); if (tempTask.value &&
tempTask.value.settings) {
tempTask.value.settings.updateActionSettings(previousRenderMethod as ACTIONS,
formattedSettings); } validationError.value = ''; } } //
更新previousRenderMethod previousRenderMethod = newMethod || null; }, {
immediate: true });
```

### 2. ActionSettings.vue 的簡化

移除了複雜的組件引用管理邏輯：

- 移除 `previousActionRef` 引用
- 移除 `validatePrevious()` 方法
- 移除 `getPreviousSettings()` 方法
- 簡化 watch 邏輯

## 修復的核心優勢

1. **時序穩定**: 直接驗證當前組件，不依賴於保存的引用
2. **邏輯簡化**: 移除複雜的組件引用管理
3. **行為一致**: 與保存按鈕的驗證行為完全一致
4. **錯誤提示**: 提供更清晰的錯誤訊息，指出需要修復哪個 ACTION

## 測試場景

### 場景 1: 有錯誤時嘗試切換

✅ **期望**: 阻止切換，顯示錯誤訊息，保持在當前 ACTION
✅ **實際**: 切換被阻止，錯誤訊息顯示

### 場景 2: 修復錯誤後切換

✅ **期望**: 允許切換，自動保存設定
✅ **實際**: 切換成功，設定已保存

### 場景 3: 正常切換

✅ **期望**: 正常切換，自動保存設定
✅ **實際**: 切換成功，設定已保存

## 技術細節

### 關鍵改進點

1. **驗證時機**: 在組件切換**之前**驗證，而不是在切換**過程中**
2. **組件狀態**: 直接使用當前顯示的組件，避免引用管理問題
3. **錯誤處理**: 提供具體的錯誤訊息，指出問題所在的 ACTION

### 移除的複雜邏輯

- `previousActionRef` 組件引用保存
- 複雜的組件狀態複製機制
- `validatePrevious()` 和 `getPreviousSettings()` 方法

## 結果

✅ **ACTION 切換驗證邏輯完全修復**
✅ **錯誤時阻止切換的行為正常工作**
✅ **與保存按鈕行為一致**
✅ **代碼邏輯更簡潔穩定**

## 文件修改記錄

- `TaskSettingsForm.vue`: 重寫 watch 邏輯，採用直接驗證策略
- `ActionSettings.vue`: 移除 previousActionRef 相關邏輯，簡化組件結構

## 開發環境

- 開發服務器: http://localhost:5173/
- 熱更新: 正常工作
- 編譯狀態: 無錯誤

此修復解決了 ACTION 切換驗證的所有問題，提供了穩定可靠的用戶體驗。
