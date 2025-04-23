<template>
  <div v-if="app_state.loading">Loading...</div>
  <div v-else-if="app_state.error">Failed to load native API</div>
  <div v-else>
    <MainView />
    <!-- <SettingsPanel /> -->
    <MenuOptions v-if="app_state.isMenuVisible" />
  </div>
</template>

<script setup lang="ts">
import MainView from "./views/MainView.vue";
// import SettingsPanel from "./components/SettingsPanel.vue";
import MenuOptions from "./components/MenuOptions.vue";
import { useAPP_STATE, useTASKS } from "./stores/stores";
const app_state = useAPP_STATE();
app_state.initFromPython();
useTASKS().initTasks();
</script>

<style>
body {
  margin: 0;
  font-family: sans-serif;
}
</style>
