<template>
  <div v-if="store.loading">Loading...</div>
  <div v-else-if="store.error">Failed to load native API</div>
  <div v-else>
    <MainView />
    <!-- <SettingsPanel /> -->
  </div>
</template>

<script setup lang="ts">
import MainView from "./views/MainView.vue";
// import SettingsPanel from "./components/SettingsPanel.vue";
import { useCONSTANTS } from "./stores/app";
const store = useCONSTANTS();
</script>

<style>
body {
  margin: 0;
  font-family: sans-serif;
}
</style>
