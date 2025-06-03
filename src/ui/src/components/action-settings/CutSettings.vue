<template>
    <div class="cut-settings">
        <div class="cut-cells">
            <div v-for="(cutCell, index) in cutCells" :key="cutCell.id" class="cut-cell">
                <div class="cut-cell-inputs">
                    <div class="form-group">
                        <label>{{ $t('actionSettings.Cut.start') }}</label>
                        <input type="text" v-model="cutCell.start" :disabled="disabled" placeholder="00:00:000"
                            @focus="saveOldValue(index, 'start')" @input="validateAndUpdate(index, 'start', $event)"
                            class="time-input" />
                    </div>
                    <div class="form-group">
                        <label>{{ $t('actionSettings.Cut.end') }}</label>
                        <input type="text" v-model="cutCell.end" :disabled="disabled" placeholder="00:00:123"
                            @focus="saveOldValue(index, 'end')" @input="validateAndUpdate(index, 'end', $event)"
                            class="time-input" />
                    </div>
                </div> <button v-if="cutCells.length > 1" @click="removeCutCell(index)" :disabled="disabled"
                    class="remove-button" :title="$t('actionSettings.Cut.removeSegment')">
                    <i class="fas fa-trash"></i>
                    {{ $t('actionSettings.Cut.removeSegment') }}
                </button>
            </div>
        </div>
        <div class="actions">
            <button @click="addCutCell" :disabled="disabled" class="add-button">
                <i class="fas fa-plus"></i>
                {{ $t('actionSettings.Cut.addSegment') }}
            </button>
        </div>

        <div v-if="validationError" class="error-message">
            {{ validationError }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import type { ActionSettingsProps, ActionSettingsEmits } from './types';
import { logger } from '../../utils/logger';
import { useAppState } from "@/stores/stores"

const appState = useAppState();
const { t } = appState; // 從 appState 獲取翻譯函數

interface CutCell {
    id: string;
    start: string;
    end: string;
}

const props = defineProps<ActionSettingsProps>();
const emit = defineEmits<ActionSettingsEmits>();

const cutCells = ref<CutCell[]>([]);
const validationError = ref<string>('');
const oldValues = ref<Map<string, string>>(new Map());

// 時間格式驗證正則表達式
const timeRegex = /^\d{0,2}:[0-5]?\d?:\d{0,3}$/;

// 初始化或重置為預設值
const initializeSettings = () => {
    cutCells.value = [
        {
            id: crypto.randomUUID(),
            start: '00:00:000',
            end: '00:00:123'
        }
    ];
};

// 格式化時間戳
const formatTimestamp = (timeStr: string): string => {
    if (!timeStr) return "00:00:000";

    const parts = timeStr.split(":");
    let minutes = "00";
    let seconds = "00";
    let milliseconds = "000";

    if (parts.length >= 1) {
        minutes = parts[0].padStart(2, "0");
    }
    if (parts.length >= 2) {
        seconds = parts[1].padStart(2, "0");
    }
    if (parts.length >= 3) {
        milliseconds = parts[2].padEnd(3, "0");
    }

    return `${minutes}:${seconds}:${milliseconds}`;
};

// 時間戳轉毫秒
const timestampToMs = (timeStr: string): number => {
    const formatted = formatTimestamp(timeStr);
    const [minutes, seconds, ms] = formatted.split(":").map(Number);
    return minutes * 60000 + seconds * 1000 + ms;
};

// 驗證時間輸入
const validateTimeInput = (value: string): boolean => {
    return timeRegex.test(value);
};

// 驗證時間段邏輯
const validateTimeRange = (start: string, end: string): { valid: boolean; message?: string } => {
    const startMs = timestampToMs(start);
    const endMs = timestampToMs(end);

    if (endMs <= startMs) {
        return { valid: false, message: t('actionSettings.Cut.errorEndGtStart') };
    }

    return { valid: true };
};

// 保存輸入前的舊值
const saveOldValue = (index: number, field: 'start' | 'end') => {
    const key = `${index}-${field}`;
    oldValues.value.set(key, cutCells.value[index][field]);
};

// 驗證並更新值
const validateAndUpdate = (index: number, field: 'start' | 'end', event: Event) => {
    const target = event.target as HTMLInputElement;
    const newValue = target.value;
    const key = `${index}-${field}`;
    const oldValue = oldValues.value.get(key) || cutCells.value[index][field];

    // 格式驗證
    if (!validateTimeInput(newValue)) {
        // 恢復到之前的值（觸發 Vue 響應式更新）
        cutCells.value[index][field] = oldValue;
        // 使用 nextTick 確保 DOM 更新後再設置焦點
        nextTick(() => {
            target.blur();
            target.focus();
        });
        return;
    }

    // 更新值
    cutCells.value[index][field] = newValue;

    // 保存新的有效值作為下次的舊值
    oldValues.value.set(key, newValue);

    // 驗證時間範圍
    const { valid, message } = validateTimeRange(
        cutCells.value[index].start,
        cutCells.value[index].end
    ); if (!valid) {
        validationError.value = message || '';
        emit('validation-error', message || '');
    } else {
        validationError.value = '';
        // 當驗證通過時，也要通知父組件清除錯誤
        emit('validation-error', '');
    }
};

// 新增剪切片段
const addCutCell = () => {
    cutCells.value.splice(cutCells.value.length - 1, 0, {
        id: crypto.randomUUID(),
        start: '00:00:000',
        end: '00:00:123'
    });
};

// 移除剪切片段
const removeCutCell = (index: number) => {
    if (cutCells.value.length > 1) {
        cutCells.value.splice(index, 1);
    }
};

// 驗證所有設定
const validate = (): { valid: boolean; message?: string } => {
    for (const cell of cutCells.value) {
        const result = validateTimeRange(cell.start, cell.end);
        if (!result.valid) {
            return result;
        }
    }
    return { valid: true };
};

// 重置設定
const reset = () => {
    initializeSettings();
    validationError.value = '';
};

// 獲取設定值（返回新格式以供轉換器使用）
const getSettings = () => {
    // 在保存時才進行時間戳格式化
    return {
        segments: cutCells.value.map(cell => ({
            start: formatTimestamp(cell.start),
            end: formatTimestamp(cell.end)
        }))
    };
};

// 監聽設定變化
watch(cutCells, () => {
    emit('update:settings', getSettings());
}, { deep: true });

// 從props初始化設定
onMounted(() => {
    if (props.task?.settings && props.task.renderMethod) {
        // 直接從新的簡化設定格式載入
        const settings = props.task.settings[props.task.renderMethod];
        if (settings && settings.segments) {
            cutCells.value = settings.segments.map((segment: any) => ({
                id: crypto.randomUUID(),
                start: segment.start || '00:00:000',
                end: segment.end || '00:00:123'
            }));
        } else {
            initializeSettings();
        }
    } else {
        initializeSettings();
    }
});

// 暴露組件方法供父組件調用
defineExpose({
    validate,
    reset,
    getSettings
});
</script>

<style scoped>
.cut-settings {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.cut-cells {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.cut-cell {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 1px solid var(--app-border-color);
    border-radius: 6px;
    background-color: var(--app-background-secondary-color);
}

.cut-cell-inputs {
    display: flex;
    gap: 16px;
    flex: 1;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.form-group label {
    font-size: 12px;
    font-weight: bold;
    color: var(--app-text-secondary-color);
}

.time-input {
    padding: 6px 8px;
    border: 1px solid var(--app-border-color);
    border-radius: 4px;
    font-family: monospace;
    width: 80px;
    background-color: var(--app-input-background-color);
    color: var(--app-text-color);
}

.remove-button {
    padding: 6px 12px;
    background-color: #ff4444;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
}

.remove-button:hover:not(:disabled) {
    background-color: #cc0000;
}

.remove-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.actions {
    display: flex;
    justify-content: flex-start;
}

.add-button {
    padding: 8px 16px;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
}

.add-button:hover:not(:disabled) {
    background-color: #45a049;
}

.add-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.error-message {
    color: var(--app-error-color);
    font-size: 14px;
    font-weight: bold;
    padding: 8px 12px;
    background-color: var(--app-error-background-color);
    border: 1px solid var(--app-error-border-color);
    border-radius: 4px;
}

.cut-cell-inputs .form-group {
    min-width: 90px;
}
</style>
