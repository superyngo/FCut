<template>
    <div class="message-bar">
        <!-- 取消選取按鈕放置在訊息欄中 -->
        <div v-if="taskStore.hasTasksSelected" class="clear-selection-wrapper">
            <button @click="clearAllSelections" class="clear-selection-button" title="取消所有選取">
                <img src="../assets/cancel-all.svg" alt=" 刪除" />
                <span class="visually-hidden">取消所有選取</span>
            </button>
        </div>
        <div class="message-content">
            <span>{{ message }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTasks } from "../stores/stores";

const taskStore = useTasks();

// 計算要顯示的訊息
const message = computed(() => {
    if (taskStore.tasks.length === 0) {
        return "請新增檔案";
    }

    if (taskStore.hasTasksSelected) {
        const selectedCount = taskStore.selectedTasks.length;
        return `已選擇 ${selectedCount} 個影片，可執行：Render / Remove`;
    }

    return "選擇影片以執行操作"; // 有檔案但沒有選取時顯示的訊息
});

// 清除所有選取的任務
const clearAllSelections = () => {
    taskStore.unselect_all_tasks();
};
</script>

<style scoped>
.message-bar {
    position: relative;
    background-color: #2c2c2c;
    border: 1px solid #333;
    padding: 12px 15px;
    display: flex;
    align-items: center;
    height: 50px;
    /* 固定高度 */
    width: 100%;
    /* max-width: 85%; */
    margin: 10px auto 0;
    /* 調整頂部間距 */
    border-radius: 8px 8px 0 0;
    /* 上方圓角，下方平直與任務列連接 */
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.15);
    z-index: 10;
    box-sizing: border-box;
    border-bottom: none;
    /* 移除底部邊框，與任務列連接 */
}

.message-content {
    flex: 1;
    text-align: center;
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.3px;
}

/* 取消選取按鈕樣式 */
.clear-selection-wrapper {
    position: relative;
    margin-right: 10px;
}

.clear-selection-button {
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    background-color: transparent;
    border: none;
    width: 28px;
    height: 28px;
    font-size: 0;
    /* 隱藏文字 */

    cursor: pointer;
    transition: transform 0.2s ease;
    outline: none;
    filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.2));
}

.clear-selection-button img {
    filter: invert(1);
}

.clear-selection-button:hover {
    transform: scale(1.1);
    filter: drop-shadow(0 3px 3px rgba(0, 0, 0, 0.3));
}

.clear-selection-button:active {
    transform: scale(0.95);
}

/* 視覺隱藏但保留無障礙功能 */
.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
}
</style>
