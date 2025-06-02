<template>
    <div class="action-settings">
        <component :is="currentActionComponent" v-if="currentActionComponent" :task="task" :disabled="disabled"
            @update:settings="handleSettingsUpdate" @validation-error="handleValidationError"
            ref="actionComponentRef" />
        <div v-else class="no-action-selected">
            <i class="fas fa-info-circle"></i>
            <p>請先選擇一個處理模式</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { ACTIONS } from '../../models/tasks';
import type { ActionComponent } from './types';

// 動態導入所有ACTION組件
import CutSettings from './CutSettings.vue';
import SpeedupSettings from './SpeedupSettings.vue';
import JumpcutSettings from './JumpcutSettings.vue';
import CutSilenceSettings from './CutSilenceSettings.vue';
import CutMotionlessSettings from './CutMotionlessSettings.vue';
import CompressVideoSettings from './CompressVideoSettings.vue';
import ConvertToAudioSettings from './ConvertToAudioSettings.vue';

interface Props {
    task: any;
    disabled?: boolean;
}

interface Emits {
    (e: 'update:settings', settings: any): void;
    (e: 'validation-error', message: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    'update:settings': [settings: any];
    'validation-error': [message: string];
}>();

const actionComponentRef = ref<ActionComponent | null>(null);

// ACTION組件映射
const actionComponents = {
    [ACTIONS.CUT]: CutSettings,
    [ACTIONS.SPEEDUP]: SpeedupSettings,
    [ACTIONS.JUMPCUT]: JumpcutSettings,
    [ACTIONS.CUT_SILENCE]: CutSilenceSettings,
    [ACTIONS.CUT_MOTIONLESS]: CutMotionlessSettings,
    [ACTIONS.COMPRESS_VIDEO]: CompressVideoSettings,
    [ACTIONS.CONVERT_TO_AUDIO]: ConvertToAudioSettings,
};

// 當前選中的ACTION組件
const currentActionComponent = computed(() => {
    if (!props.task?.renderMethod || !(props.task.renderMethod in actionComponents)) {
        return null;
    }
    return actionComponents[props.task.renderMethod as ACTIONS];
});

// 處理設定更新
const handleSettingsUpdate = (settings: any) => {
    emit('update:settings', settings);
};

// 處理驗證錯誤
const handleValidationError = (message: string) => {
    emit('validation-error', message);
};

// 暴露方法供父組件調用
const validate = (): { valid: boolean; message?: string } => {
    if (!actionComponentRef.value) {
        return { valid: true };
    }
    return actionComponentRef.value.validate();
};

const reset = () => {
    if (actionComponentRef.value) {
        actionComponentRef.value.reset();
    }
};

const getSettings = () => {
    if (!actionComponentRef.value) {
        return {};
    }
    return actionComponentRef.value.getSettings();
};

// 當renderMethod改變時，重置組件引用
watch(() => props.task?.renderMethod, async (newMethod, oldMethod) => {
    // 只有在方法真正改變時才進行處理
    if (newMethod === oldMethod) return;

    // 重置當前組件引用
    actionComponentRef.value = null;

    // 等待組件完全重新渲染
    await nextTick();
    await nextTick(); // 雙重等待確保組件完全準備好
}, { immediate: false }); // 改為false，避免初始化時觸發

defineExpose({
    validate,
    reset,
    getSettings
});
</script>

<style scoped>
.action-settings {
    min-height: 200px;
}

.no-action-selected {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #666;
    text-align: center;
}

.no-action-selected i {
    font-size: 48px;
    color: #ddd;
    margin-bottom: 16px;
}

.no-action-selected p {
    margin: 0;
    font-size: 16px;
}
</style>
