<template>
    <div class="message-bar">
        <!-- 取消選取按鈕放置在訊息欄中 -->
        <div v-if="taskStore.hasTasksSelected" class="clear-selection-wrapper">
            <button @click="clearAllSelections" class="clear-selection-button" :title="$t('messageBar.clearAllTitle')">
                <img src="../assets/cancel-all.svg" :alt="$t('messageBar.clearAllAlt')" />
                <span class="visually-hidden">{{ $t('messageBar.clearAll') }}</span>
            </button>
        </div>
        <!-- 警告圖標 -->
        <div v-if="appState.messageQueue.length > 0" class="warning-icon">
            ⚠️
        </div>
        <div class="message-content">
            <Transition name="fade" mode="out-in">
                <span :key="message" :class="{ 'warning-message': appState.messageQueue.length > 0 }">
                    {{ messageI18n }}
                </span>
            </Transition>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from "vue";
import { useTasks, useAppState } from "../stores/stores";

const taskStore = useTasks();
const appState = useAppState();
const { t } = appState; // 從 appState 獲取翻譯函數

// 計算要顯示的訊息
const message = computed(() => {
    if (appState.messageQueue.length > 0) {
        return appState.messageQueue[0];
    }
    if (taskStore.tasks.length === 0) {
        return 'empty';
    }
    if (taskStore.hasTasksSelected) {
        const selectedCount = taskStore.selectedTasks.length;
        return { type: 'selected', count: selectedCount };
    }
    return 'select';
});

const messageI18n = computed(() => {
    if (typeof message.value === 'string') {
        if (message.value === 'empty') return t('messageBar.empty');
        if (message.value === 'select') return t('messageBar.select');
        return message.value;
    } else if (typeof message.value === 'object' && message.value.type === 'selected') {
        return t('messageBar.selected', { count: message.value.count });
    }
    return '';
});

// 監聽訊息佇列變化，自動移除顯示的訊息
let timeoutId: number | null = null;

watch(
    () => appState.messageQueue.length,
    (newLength) => {
        if (newLength > 0) {
            // 清除之前的計時器
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            // 設置新的計時器，2秒後移除第一個訊息
            timeoutId = window.setTimeout(() => {
                appState.removeFirstMessage();
                timeoutId = null;
            }, 2000);
        }
    },
    { immediate: true }
);

// 清除所有選取的任務
const clearAllSelections = () => {
    taskStore.unselect_all_tasks();
};

// 組件卸載時清理計時器
onUnmounted(() => {
    if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
    }
});

// 開發模式下添加測試功能到全域
if (import.meta.env.DEV) {
    onMounted(() => {
        (window as any).testMessageBar = {
            addWarning: () => appState.addMessage("test.txt 不是媒體檔案"),
            addInfo: () => appState.addMessage("檔案添加成功"),
            addLongPath: () => appState.addMessage("C:\\Users\\user\\OneDrive - Chunghwa Telecom Co., Ltd\\文件\\Projects\\Very-Long-Project-Name\\src\\components\\some-very-long-filename-with-many-words.mp4 不是媒體檔案"),
            addMultiple: () => {
                appState.addMessage("document.pdf 不是媒體檔案");
                setTimeout(() => appState.addMessage("C:\\Very\\Long\\Directory\\Path\\With\\Many\\Folders\\image.jpg 不是媒體檔案"), 500);
                setTimeout(() => appState.addMessage("檔案處理完成"), 2500);
            }
        };
    });
}
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
    overflow: hidden;
    /* 確保動畫不溢出 */
    white-space: nowrap;
    /* 防止文字換行 */
    text-overflow: ellipsis;
    /* 如果仍然過長則顯示省略號 */
    min-width: 0;
    /* 確保 flex 項目可以縮小 */
}

/* 淡入淡出過渡動畫 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* 警告訊息樣式 */
.warning-message {
    color: #ff4444 !important;
    font-weight: 700 !important;
    text-shadow: 0 0 5px rgba(255, 68, 68, 0.5);
}

/* 警告圖標樣式 */
.warning-icon {
    font-size: 18px;
    margin-right: 8px;
    opacity: 0.9;
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
    filter: var(--app-icon-filter);
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
