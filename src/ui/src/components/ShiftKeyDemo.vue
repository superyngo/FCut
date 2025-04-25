<template>
  <div class="shift-key-demo">
    <h3>Shift 鍵事件示例</h3>
    <div class="status-display" :class="{ active: isShiftPressed }">
      <p>Shift 鍵狀態: {{ isShiftPressed ? "按下中" : "未按下" }}</p>
      <p>按下次數: {{ pressCount }}</p>
      <p>釋放次數: {{ releaseCount }}</p>
    </div>
    <div class="action-box" :class="{ active: isShiftPressed }">
      <p>按下 Shift 鍵來啟動特殊功能</p>
      <div v-if="isShiftPressed" class="active-indicator">
        Shift 模式已啟動!
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { on_shift } from "../utils/on_events";

// 反應性狀態
const isShiftPressed = ref(false);
const pressCount = ref(0);
const releaseCount = ref(0);

// Shift 按下與釋放的回調函數
const onShiftPress = () => {
  isShiftPressed.value = true;
  pressCount.value++;
};

const onShiftRelease = () => {
  isShiftPressed.value = false;
  releaseCount.value++;
};

// 存儲清理函數
let cleanup: (() => void) | null = null;

// 組件掛載時設置事件監聽
onMounted(() => {
  cleanup = on_shift({
    onPress: [onShiftPress],
    onRelease: [onShiftRelease],
  });
});

// 組件卸載時清理事件監聽
onUnmounted(() => {
  if (cleanup) {
    cleanup();
  }
});
</script>

<style scoped>
.shift-key-demo {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin: 20px 0;
  max-width: 500px;
}

.status-display {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.status-display.active {
  background-color: #d4edda;
  box-shadow: 0 0 10px rgba(40, 167, 69, 0.5);
}

.action-box {
  position: relative;
  height: 120px;
  background-color: #e9ecef;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #495057;
  overflow: hidden;
  transition: all 0.3s ease;
}

.action-box.active {
  background-color: #cce5ff;
  color: #004085;
}

.active-indicator {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: #28a745;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-weight: bold;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.7;
  }
}
</style>
