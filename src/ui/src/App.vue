<template>
  <div v-if="app_state.loading">Loading...</div>
  <div v-else-if="app_state.error">Failed to load native API</div>
  <div v-else>
    <MainView />
  </div>
</template>

<script setup lang="ts">
import MainView from "./views/MainView.vue";
// import SettingsPanel from "./components/SettingsPanel.vue";
import { useAPP_STATE_inited } from "./stores/stores";
import { logger } from "./utils/logger";
const app_state = useAPP_STATE_inited();
</script>

<style>
body {
  margin: 0;
  font-family: sans-serif;
}
</style>
