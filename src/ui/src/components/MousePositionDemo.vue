<template>
  <div class="mouse-position-demo">
    <h3>滑鼠位置追蹤示例</h3>
    <div class="position-display">
      <p>滑鼠 X 座標: {{ mouseStore.mouseX }}</p>
      <p>滑鼠 Y 座標: {{ mouseStore.mouseY }}</p>
    </div>
    <div
      class="tracking-area"
      :style="{
        '--mouse-x': mouseStore.mouseX + 'px',
        '--mouse-y': mouseStore.mouseY + 'px',
      }"
    >
      滑鼠在此區域內移動
      <div class="mouse-indicator"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMouseTracking } from "../stores/mouseXY";

// 使用滑鼠追蹤 store，自動啟動追蹤
const mouseStore = useMouseTracking();
</script>

<style scoped>
.mouse-position-demo {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin: 20px 0;
  max-width: 500px;
}

.position-display {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.tracking-area {
  position: relative;
  height: 200px;
  background-color: #e0e0e0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #666;
  overflow: hidden;
}

.mouse-indicator {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgba(52, 152, 219, 0.7);
  transform: translate(calc(var(--mouse-x) - 50%), calc(var(--mouse-y) - 50%));
  pointer-events: none; /* 讓滑鼠事件穿透此元素 */
  transition: transform 0.05s ease;
  box-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
}
</style>
