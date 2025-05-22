<template>
    <teleport to="body">
        <div class="modal-overlay" @click.self="handleOverlayClick">
            <div class="modal-content" :class="modalClass" :style="contentStyle" ref="modalWindow">
                <div v-if="!headless" class="modal-header draggable" ref="modalHeader">
                    <svg v-if="showBackButton" @click="onBackClick" class="modal-back-icon" viewBox="0 0 24 24"
                        fill="currentColor">
                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                    </svg>
                    <h3 :class="{ 'with-back-button': showBackButton }">{{ title }}</h3>
                    <button @click="closeModal" class="close-button">
                        &times;
                    </button>
                </div>
                <div class="modal-body">
                    <slot></slot>
                </div>
            </div>
        </div>
    </teleport>
</template>

<script setup lang="ts">
// defineModel 通常在 <script setup> 中是編譯器宏，無需顯式導入，但若 Linter 提示可加上
import { ref, onMounted, onUnmounted, defineModel } from 'vue';
import { logger } from '../utils/logger';
import { makeDraggable, MouseListenerHandle, onDrag, _dragState } from '../utils/mouseEvents';
import { KeyListenerHandle } from "../utils/keyEvents";
import { useCallBackRedistry } from "../stores/stores";

const callbackRegistry = useCallBackRedistry();

type Props = {
    title?: string;
    modalClass?: string | Record<string, boolean> | (string | Record<string, boolean>)[];
    contentStyle?: Record<string, string>;
    closeOnOverlayClick?: boolean;
    headless?: boolean;
    showBackButton?: boolean; // 新增：是否顯示返回按鈕
}

// isOpen 的預設值已從 withDefaults 中移除
const props = withDefaults(defineProps<Props>(), {
    title: '',
    modalClass: '',
    contentStyle: () => ({}),
    closeOnOverlayClick: true,
    headless: false,
    showBackButton: false,
});
const emit = defineEmits(['close', 'back-clicked']); // 新增 back-clicked 事件

// 使用 defineModel 來處理 isOpen
const isOpen = defineModel<boolean>('isOpen', { default: false });

const closeModal = () => {
    // 當 isOpen.value 被設置為 false 時，Vue 會自動 emit('update:isOpen', false)
    if (isOpen.value) { // 確保在 true 時才更新，避免不必要的 emit
        isOpen.value = false;
    }
    emit('close'); // 保留 'close' 事件的發送
};

const onBackClick = () => {
    emit('back-clicked');
};
const handleOverlayClick = () => {
    if (props.closeOnOverlayClick) {
        closeModal();
    }
};

let draggableEvent: MouseListenerHandle[] = []

const modalWindow = ref<HTMLElement | null>(null);
const modalHeader = ref<HTMLElement | null>(null);

onMounted(() => {
    if (modalHeader.value && modalWindow.value && !props.headless) {
        draggableEvent.push(makeDraggable(modalWindow.value, modalHeader.value)!)
    }
    callbackRegistry.registeredBackgroundEvents.forEach((handle) => {
        (handle as KeyListenerHandle).registeredConfigs.forEach((config) => {
            if (config.key === 'Escape') {
                config.callback = config.swap(closeModal)
            } else {
                config.callback = config.swap(() => { })
            }
        })
    });
});

onUnmounted(() => {
    if (draggableEvent) {
        draggableEvent.forEach((c) => c())
    }
});

</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    /* 避免內容溢出圓角 */
    width: 90%;
    max-width: 500px;
    /* 預設最大寬度 */
    animation: modal-appear 0.3s ease-out;
    /* ease-out 讓動畫結束時更平滑 */
    display: flex;
    flex-direction: column;
    position: absolute;
    /* 為了拖曳定位 */
}

.modal-header {
    display: flex;
    /* justify-content: space-between; */
    /* 動態調整對齊方式 */
    align-items: center;
    padding: 16px;
    background-color: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
    cursor: grab;
}

.modal-back-icon {
    width: 24px;
    /* SVG 大小 */
    height: 24px;
    /* SVG 大小 */
    cursor: pointer;
    color: #555;
    margin-right: 8px;
    /* 與標題間距 */
}

.modal-back-icon:hover {
    color: #000;
}

.modal-header h3 {
    margin: 0;
    font-size: 18px;
    color: #333;
    flex-grow: 1;
    /* 讓標題填滿可用空間 */
    text-align: center;
    /* 標題文字置中 */
}

.modal-header h3.with-back-button {
    text-align: left;
    /* 有返回按鈕時，標題文字靠左 */
    /* 如果需要更精確的置中，可能需要其他佈局技巧 */
}


.close-button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #555;
    padding: 0;
    line-height: 1;
    margin-left: auto;
    /* 將關閉按鈕推到最右側 */
}

.modal-body {
    padding: 16px;
    overflow-y: auto;
    max-height: 70vh;
    /* 限制 body 最大高度，超出則滾動 */
}

@keyframes modal-appear {
    from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}
</style>
