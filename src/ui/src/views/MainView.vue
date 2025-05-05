<template>
  <div class="main-view">
    <TopBar />
    <div class="task-list-container">
      <TaskList />
    </div>
    <!-- 添加集中式的模態框組件 -->
    <AppModals />
  </div>
</template>

<script setup lang="ts">
import TopBar from "../components/TopBar.vue";
import TaskList from "../components/TaskList.vue";
import AppModals from "../components/AppModals.vue";
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
