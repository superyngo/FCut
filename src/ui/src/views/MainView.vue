<template>
  <div class="main-view">
    <TopBar />
    <!-- 使用抽出的訊息欄組件 -->
    <MessageBar />
    <div class="task-list-container">
      <TaskList />
    </div>
    <!-- 添加集中式的模態框組件 -->
    <AppModals />

  </div>
</template>

<script setup lang="ts">
import TopBar from "../components/TopBar.vue";
import MessageBar from "../components/MessageBar.vue";
import TaskList from "../components/TaskList.vue";
import AppModals from "../components/AppModals.vue";
import { logger } from "../utils/logger";
import { useAppState } from "../stores/stores";

const appState = useAppState();

// 示例：可以在這裡添加測試訊息到佇列
// appState.addMessage("這是一個測試訊息");

// 添加測試按鈕來演示MessageBar功能
const addTestWarning = () => {
  appState.addMessage("test.txt 不是媒體檔案");
};

const addTestSuccess = () => {
  appState.addMessage("檔案添加成功！");
};

// 暴露測試函數到全域，方便瀏覽器控制台測試
if (typeof window !== 'undefined') {
  (window as any).testMessageBar = {
    addWarning: addTestWarning,
    addSuccess: addTestSuccess,
    addMultiple: () => {
      appState.addMessage("document.pdf 不是媒體檔案");
      setTimeout(() => appState.addMessage("image.jpg 不是媒體檔案"), 500);
      setTimeout(() => appState.addMessage("presentation.pptx 不是媒體檔案"), 1000);
    }
  };
}
</script>

<style scoped>
.main-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-top: 60px;
  /* 為固定的頂部導航欄留出空間 */
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  overflow: hidden;
  /* 確保主視窗不會出現滾動條 */
  box-sizing: border-box;
  position: relative;
  padding-left: 10px;
  /* 增加左側邊距 */
  padding-right: 10px;
  /* 增加右側邊距 */
}

.task-list-container {
  flex: 1;
  display: flex;
  justify-content: center;
  /* 水平置中 */
  align-items: flex-start;
  /* 任務列頂部對齊 */
  width: 100%;
  padding: 0;
  /* 移除內邊距，由子組件控制 */
  margin-top: 0;
  /* 移除頂部間距以實現與訊息欄無縫連接 */
  overflow: hidden;
  /* 防止容器本身出現滾動條 */
  height: calc(100vh - 120px);
  /* 精確計算剩餘可用空間 */
  position: relative;
  /* 為絕對定位子元素提供參考 */
}
</style>
