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
import { useAPP_STATE_inited } from "./stores/stores";
import { useKeyListener } from "./stores/keyStore";
import { modifier_keys } from "./utils/on_events";

const app_state = useAPP_STATE_inited();
const on_events = useKeyListener();

on_events.on_keys("Escape", {
  type: "onPress",
  callback: [
    () => {
      console.log(123);
    },
    () => console.log(456),
  ],
});

on_events.on_keys("d", {
  type: "onPress",
  callback: [
    () => {
      console.log(123);
    },
    () => console.log(456),
  ],
  withControl: [modifier_keys.Control],
});
</script>

<style>
body {
  margin: 0;
  font-family: sans-serif;
}
</style>
