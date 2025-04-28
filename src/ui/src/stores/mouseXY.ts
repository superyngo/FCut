// filepath: f:\FCut\src\ui\src\stores\mouseXY.ts
import { defineStore } from "pinia";
import { onMounted, onUnmounted, ref } from "vue";
import { Logger } from "../utils/logger";

export const useMouseXY = defineStore("mouseXY", {
  state: () => ({
    mouseX: 0,
    mouseY: 0,
    isTracking: false,
  }),

  actions: {
    startTracking() {
      if (this.isTracking) return;
      Logger.info("開始追蹤滑鼠位置");

      // 確保只在客戶端環境執行
      if (typeof window !== "undefined" && typeof document !== "undefined") {
        window.addEventListener("mousemove", this.handleMouseMove);
        this.isTracking = true;
      }
    },

    stopTracking() {
      if (!this.isTracking) return;
      Logger.info("停止追蹤滑鼠位置");

      if (typeof window !== "undefined") {
        window.removeEventListener("mousemove", this.handleMouseMove);
        this.isTracking = false;
      }
    },

    handleMouseMove(event: MouseEvent) {
      this.mouseX = event.clientX;
      this.mouseY = event.clientY;
    },
  },
});

// 建立一個 composable 來自動啟動追蹤
const started = ref(false);
export function useMouseTracking() {
  const mouse_coordinate = useMouseXY();
  // 使用 ref 確保只在客戶端 onMounted 中執行
  onMounted(() => {
    if (!started.value) {
      mouse_coordinate.startTracking();
      started.value = true;
    }
  });

  onUnmounted(() => {
    started.value = false;
    mouse_coordinate.stopTracking();
  });

  return mouse_coordinate;
}
