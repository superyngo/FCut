<template>
  <div v-if="appState.loading">Loading...</div>
  <div v-else-if="appState.error">Failed to load native API</div>
  <div v-else>
    <MainView />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import MainView from "./views/MainView.vue";
import { useAppState } from "./stores/stores";
import { logger } from "./utils/logger";

const appState = useAppState();
const { theme } = storeToRefs(appState);

// 應用主題到 CSS 變數
const applyTheme = (themeValue: string) => {
  const root = document.documentElement; if (themeValue === 'light') {
    // 亮色主題
    root.style.setProperty('--app-bg-color', '#ffffff');
    root.style.setProperty('--app-text-color', '#1a1a1a');
    root.style.setProperty('--app-accent-color', '#2196f3');
    root.style.setProperty('--app-surface-color', '#f5f5f5');
    root.style.setProperty('--app-border-color', '#e0e0e0');
    root.style.setProperty('--app-hover-color', '#f0f0f0');
    root.style.setProperty('--app-shadow-color', 'rgba(0, 0, 0, 0.1)');
    root.style.setProperty('--app-icon-filter', 'invert(0.2)');
    root.style.setProperty('--app-text-secondary-color', '#666666');
    root.style.setProperty('--app-input-background-color', '#ffffff');
    root.style.setProperty('--app-background-secondary-color', '#fafafa');
    root.style.setProperty('--app-accent-hover-color', '#1976d2');
    root.style.setProperty('--app-error-color', '#d32f2f');
    root.style.setProperty('--app-error-background-color', '#fff3cd');
    root.style.setProperty('--app-error-border-color', '#ffeaa7');
    root.style.setProperty('--scrollbar-track-color', '#f1f1f1');
    root.style.setProperty('--scrollbar-thumb-color', '#c1c1c1');
    root.style.setProperty('--scrollbar-thumb-hover-color', '#a8a8a8');
  } else {
    // 暗色主題 (預設)
    root.style.setProperty('--app-bg-color', '#121212');
    root.style.setProperty('--app-text-color', '#ffffff');
    root.style.setProperty('--app-accent-color', '#3498db');
    root.style.setProperty('--app-surface-color', '#1e1e1e');
    root.style.setProperty('--app-border-color', '#333333');
    root.style.setProperty('--app-hover-color', '#2a2a2a');
    root.style.setProperty('--app-shadow-color', 'rgba(0, 0, 0, 0.3)');
    root.style.setProperty('--app-icon-filter', 'invert(1)');
    root.style.setProperty('--app-text-secondary-color', '#cccccc');
    root.style.setProperty('--app-input-background-color', '#1e1e1e');
    root.style.setProperty('--app-background-secondary-color', '#252525');
    root.style.setProperty('--app-accent-hover-color', '#2980b9');
    root.style.setProperty('--app-error-color', '#ff6b6b');
    root.style.setProperty('--app-error-background-color', '#2d1b1b');
    root.style.setProperty('--app-error-border-color', '#5c2e2e');
    root.style.setProperty('--scrollbar-track-color', '#222');
    root.style.setProperty('--scrollbar-thumb-color', '#444');
    root.style.setProperty('--scrollbar-thumb-hover-color', '#555');
  }
};

// 監聽主題變化
watch(theme, (newTheme) => {
  applyTheme(newTheme);
}, { immediate: true });

// 組件掛載時設置事件監聽
onMounted(async () => {
  logger.info("App mounted");
  await appState.init();
  // 確保初始主題已應用
  applyTheme(theme.value);
});

</script>

<style>
:root {
  /* 主題變數將由 JavaScript 動態設定 */
  --app-bg-color: #121212;
  --app-text-color: #ffffff;
  --app-accent-color: #3498db;
  --app-surface-color: #1e1e1e;
  --app-border-color: #333333;
  --app-hover-color: #2a2a2a;
  --app-shadow-color: rgba(0, 0, 0, 0.3);
  --scrollbar-track-color: #222;
  --scrollbar-thumb-color: #444;
  --scrollbar-thumb-hover-color: #555;
}

html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: var(--app-bg-color);
  color: var(--app-text-color);
  transition: background-color 0.3s ease, color 0.3s ease;
}

*,
*::before,
*::after {
  box-sizing: inherit;
}

/* 統一按鈕樣式 */
button {
  font-family: inherit;
  user-select: none;
  /* 按鈕不允許選取文字 */
}

/* 動態滾動條樣式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--scrollbar-track-color);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb-color);
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover-color);
}

/* 全域主題過渡效果和文字選取設定 */
* {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  user-select: text;
  /* 預設允許文字選取 */
}

/* 特定元素不允許選取文字 */
button,
.button,
[role="button"] {
  user-select: none;
}

/* 確保輸入框和文字區域可以選取 */
input,
textarea,
select {
  user-select: text;
}
</style>
