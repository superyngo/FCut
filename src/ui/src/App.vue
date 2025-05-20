<template>
  <div v-if="appState.loading">Loading...</div>
  <div v-else-if="appState.error">Failed to load native API</div>
  <div v-else>
    <MainView />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from  "vue";
import MainView from "./views/MainView.vue";
// import SettingsPanel from "./components/SettingsPanel.vue";
import { useAppState } from "./stores/stores";
import { logger } from "./utils/logger";
const appState = useAppState();


  // 組件掛載時設置事件監聽
  onMounted(async () => {
    logger.info("App mounted");
      await appState.initFromPython();
  });

</script>

<style>
:root {
  --app-bg-color: #121212;
  --app-text-color: #ffffff;
  --app-accent-color: #3498db;
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
}

*,
*::before,
*::after {
  box-sizing: inherit;
}

/* 統一按鈕樣式 */
button {
  font-family: inherit;
}

/* 預設滾動條樣式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #222;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
