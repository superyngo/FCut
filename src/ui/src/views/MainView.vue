<template>
  <div class="main-view">
    <TopBar />
    <div class="task-list-container">
      <TaskList />
    </div>
  </div>
</template>

<script setup lang="ts">
import TopBar from "../components/TopBar.vue";
import TaskList from "../components/TaskList.vue";
</script>

<style scoped>
.main-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.task-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 1em;
}
</style>
