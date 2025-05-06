<template>
  <div v-if="appState.loading">Loading...</div>
  <div v-else-if="appState.error">Failed to load native API</div>
  <div v-else>
    <MainView />
  </div>
</template>

<script setup lang="ts">
import MainView from "./views/MainView.vue";
// import SettingsPanel from "./components/SettingsPanel.vue";
import { useAppStateInit } from "./stores/stores";
import { logger } from "./utils/logger";
const appState = useAppStateInit();
</script>

<style>
body {
  margin: 0;
  font-family: sans-serif;
}
</style>
