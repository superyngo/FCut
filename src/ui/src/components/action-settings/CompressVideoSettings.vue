<template>
    <div class="compress-video-settings">
        <div class="form-group">
            <label for="video-quality">{{ $t('actionSettings.CompressVideo.quality') }}</label>
            <div class="range-container">
                <input id="video-quality" type="range" v-model.number="videoQuality" :min="minCrf" :max="maxCrf"
                    :step="1" :disabled="disabled" class="quality-range" />
                <span class="quality-value">{{ videoQuality }}</span>
            </div>
            <div class="quality-scale">
                <span class="scale-label">{{ $t('actionSettings.CompressVideo.highestQuality') }}</span>
                <span class="scale-label">{{ $t('actionSettings.CompressVideo.balanced') }}</span>
                <span class="scale-label">{{ $t('actionSettings.CompressVideo.smallestFile') }}</span>
            </div>
            <div class="quality-description">
                {{ getQualityDescription() }}
            </div>
        </div> <!-- 動態估算 -->
        <div class="compression-estimate">
            <h4>{{ $t('actionSettings.CompressVideo.compressionEstimate') }}</h4>
            <div class="estimate-grid">
                <div class="estimate-item">
                    <i class="fas fa-compress-arrows-alt"></i>
                    <div class="estimate-info">
                        <span class="estimate-label">{{ $t('actionSettings.CompressVideo.expectedCompression') }}</span>
                        <span class="estimate-value">{{ estimatedCompression }}%</span>
                    </div>
                </div>
                <div class="estimate-item">
                    <i class="fas fa-eye"></i>
                    <div class="estimate-info">
                        <span class="estimate-label">{{ $t('actionSettings.CompressVideo.visualQuality') }}</span>
                        <span class="estimate-value">{{ getVisualQuality() }}</span>
                    </div>
                </div>
                <div class="estimate-item">
                    <i class="fas fa-balance-scale"></i>
                    <div class="estimate-info">
                        <span class="estimate-label">{{ $t('actionSettings.CompressVideo.recommendedUse') }}</span>
                        <span class="estimate-value">{{ getRecommendedUse() }}</span>
                    </div>
                </div>
            </div>
        </div> <!-- 預設按鈕 -->
        <div class="presets">
            <h4>{{ $t('actionSettings.CompressVideo.usagePresets') }}</h4>
            <div class="preset-buttons">
                <button v-for="preset in qualityPresets" :key="preset.name" @click="applyPreset(preset)"
                    :disabled="disabled" :class="{ active: videoQuality === preset.value }" class="preset-button">
                    <div class="preset-header">
                        <span class="preset-name">{{ $t(preset.name) }}</span>
                        <span class="preset-value">CRF {{ preset.value }}</span>
                    </div>
                    <div class="preset-desc">{{ $t(preset.description) }}</div>
                    <div class="preset-size">{{ $t(preset.sizeInfo) }}</div>
                </button>
            </div>
        </div> <!-- 靜態說明 -->
        <div class="info-section">
            <h4>{{ $t('actionSettings.CompressVideo.crfExplanation') }}</h4>
            <div class="info-grid">
                <div class="info-item">
                    <span class="crf-value">0-17</span>
                    <span>{{ $t('actionSettings.CompressVideo.crfRange0_17') }}</span>
                </div>
                <div class="info-item">
                    <span class="crf-value">18-23</span>
                    <span>{{ $t('actionSettings.CompressVideo.crfRange18_23') }}</span>
                </div>
                <div class="info-item">
                    <span class="crf-value">24-28</span>
                    <span>{{ $t('actionSettings.CompressVideo.crfRange24_28') }}</span>
                </div>
                <div class="info-item">
                    <span class="crf-value">29-35</span>
                    <span>{{ $t('actionSettings.CompressVideo.crfRange29_35') }}</span>
                </div>
                <div class="info-item">
                    <span class="crf-value">36-51</span>
                    <span>{{ $t('actionSettings.CompressVideo.crfRange36_51') }}</span>
                </div>
            </div>
        </div>

        <!-- 警告訊息 -->
        <div v-if="validationError" class="error-message">
            {{ validationError }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { ActionSettingsProps, ActionSettingsEmits } from './types';
import { useAppState } from '@/stores/stores';

const appState = useAppState();
const { t } = appState; // 從 appState 獲取翻譯函數


const props = defineProps<ActionSettingsProps>();
const emit = defineEmits<ActionSettingsEmits>();

const videoQuality = ref<number>(23);
const minCrf = 0;
const maxCrf = 51;
const validationError = ref<string>('');

// 品質預設
const qualityPresets = [
    {
        name: 'actionSettings.CompressVideo.presets.lossless.name',
        value: 18,
        description: 'actionSettings.CompressVideo.presets.lossless.description',
        sizeInfo: 'actionSettings.CompressVideo.presets.lossless.sizeInfo'
    },
    {
        name: 'actionSettings.CompressVideo.presets.highQuality.name',
        value: 23,
        description: 'actionSettings.CompressVideo.presets.highQuality.description',
        sizeInfo: 'actionSettings.CompressVideo.presets.highQuality.sizeInfo'
    },
    {
        name: 'actionSettings.CompressVideo.presets.standard.name',
        value: 28,
        description: 'actionSettings.CompressVideo.presets.standard.description',
        sizeInfo: 'actionSettings.CompressVideo.presets.standard.sizeInfo'
    },
    {
        name: 'actionSettings.CompressVideo.presets.compressed.name',
        value: 32,
        description: 'actionSettings.CompressVideo.presets.compressed.description',
        sizeInfo: 'actionSettings.CompressVideo.presets.compressed.sizeInfo'
    },
    {
        name: 'actionSettings.CompressVideo.presets.extreme.name',
        value: 40,
        description: 'actionSettings.CompressVideo.presets.extreme.description',
        sizeInfo: 'actionSettings.CompressVideo.presets.extreme.sizeInfo'
    }
];

// 獲取品質描述
const getQualityDescription = (): string => {
    if (videoQuality.value <= 17) {
        return t('actionSettings.CompressVideo.qualityDescriptions.lossless');
    } else if (videoQuality.value <= 23) {
        return t('actionSettings.CompressVideo.qualityDescriptions.high');
    } else if (videoQuality.value <= 28) {
        return t('actionSettings.CompressVideo.qualityDescriptions.standard');
    } else if (videoQuality.value <= 35) {
        return t('actionSettings.CompressVideo.qualityDescriptions.medium');
    } else {
        return t('actionSettings.CompressVideo.qualityDescriptions.low');
    }
};

// 計算預期壓縮率
const estimatedCompression = computed((): number => {
    // 這是一個簡化的估算公式
    const compressionMap: { [key: number]: number } = {
        18: 15, 20: 25, 23: 40, 26: 55, 28: 65,
        30: 70, 32: 75, 35: 80, 40: 85, 45: 90, 51: 95
    };

    // 找到最接近的值
    const crf = videoQuality.value;
    const keys = Object.keys(compressionMap).map(Number).sort((a, b) => a - b);

    for (let i = 0; i < keys.length; i++) {
        if (crf <= keys[i]) {
            return compressionMap[keys[i]];
        }
    }

    return compressionMap[keys[keys.length - 1]];
});

// 獲取視覺品質評級
const getVisualQuality = (): string => {
    if (videoQuality.value <= 17) return t('actionSettings.CompressVideo.visualQualityLevels.perfect');
    if (videoQuality.value <= 23) return t('actionSettings.CompressVideo.visualQualityLevels.excellent');
    if (videoQuality.value <= 28) return t('actionSettings.CompressVideo.visualQualityLevels.good');
    if (videoQuality.value <= 35) return t('actionSettings.CompressVideo.visualQualityLevels.fair');
    return t('actionSettings.CompressVideo.visualQualityLevels.acceptable');
};

// 獲取建議用途
const getRecommendedUse = (): string => {
    if (videoQuality.value <= 17) return t('actionSettings.CompressVideo.recommendedUses.professional');
    if (videoQuality.value <= 23) return t('actionSettings.CompressVideo.recommendedUses.important');
    if (videoQuality.value <= 28) return t('actionSettings.CompressVideo.recommendedUses.general');
    if (videoQuality.value <= 35) return t('actionSettings.CompressVideo.recommendedUses.web');
    return t('actionSettings.CompressVideo.recommendedUses.preview');
};

// 應用預設
const applyPreset = (preset: any) => {
    videoQuality.value = preset.value;
};

// 驗證設定
const validate = (): { valid: boolean; message?: string } => {
    if (videoQuality.value < minCrf || videoQuality.value > maxCrf) {
        return {
            valid: false,
            message: t('actionSettings.CompressVideo.errorCrfRange', { min: minCrf, max: maxCrf })
        };
    }

    return { valid: true };
};

// 重置設定
const reset = () => {
    videoQuality.value = 23;
};

// 獲取設定值
const getSettings = () => {
    return {
        crf: videoQuality.value
    };
};

// 監聽設定變化
watch(videoQuality, () => {
    const validation = validate();
    if (!validation.valid) {
        validationError.value = validation.message || '';
        emit('validation-error', validation.message || '');
    } else {
        validationError.value = '';
        emit('validation-error', ''); // 清除錯誤訊息
    }
    emit('update:settings', getSettings());
});

// 初始化
onMounted(() => {
    if (props.task?.settings && props.task.renderMethod) {
        // 直接從新的簡化設定格式載入
        const settings = props.task.settings[props.task.renderMethod];
        if (settings) {
            videoQuality.value = settings.quality ?? 23;
        } else {
            reset();
        }
    } else {
        reset();
    }
});

// 暴露方法
defineExpose({
    validate,
    reset,
    getSettings
});
</script>

<style scoped>
.compress-video-settings {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-group label {
    font-weight: bold;
    color: var(--app-text-color);
    font-size: 14px;
}

.range-container {
    display: flex;
    align-items: center;
    gap: 12px;
}

.quality-range {
    flex: 1;
    height: 6px;
    background: linear-gradient(to right, #4caf50, #ffeb3b, #ff5722);
    border-radius: 3px;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
}

.quality-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--app-text-color);
    cursor: pointer;
    border: 2px solid var(--app-surface-color);
    box-shadow: 0 2px 4px var(--app-shadow-color);
}

.quality-range::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--app-text-color);
    cursor: pointer;
    border: 2px solid var(--app-surface-color);
    box-shadow: 0 2px 4px var(--app-shadow-color);
}

.quality-value {
    font-weight: bold;
    font-size: 16px;
    color: var(--app-text-color);
    min-width: 40px;
    text-align: center;
    font-family: monospace;
}

.quality-scale {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--app-secondary-text-color);
    margin-top: 4px;
}

.quality-description {
    font-size: 13px;
    color: var(--app-secondary-text-color);
    font-style: italic;
    padding: 8px 12px;
    background: var(--app-hover-color);
    border-radius: 4px;
    border-left: 3px solid #4caf50;
}

.info-section {
    background: var(--app-hover-color);
    padding: 16px;
    border-radius: 8px;
    border: 1px solid var(--app-border-color);
}

.info-section h4 {
    margin: 0 0 12px 0;
    color: var(--app-text-color);
}

.info-grid {
    display: grid;
    gap: 6px;
}

.info-item {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
}

.crf-value {
    font-family: monospace;
    font-weight: bold;
    color: var(--app-secondary-text-color);
    min-width: 50px;
}

.presets h4 {
    margin: 0 0 12px 0;
    color: var(--app-text-color);
}

.preset-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
}

.preset-button {
    padding: 12px;
    border: 1px solid var(--app-border-color);
    border-radius: 6px;
    background: var(--app-surface-color);
    color: var(--app-text-color);
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
}

.preset-button:hover:not(:disabled) {
    background: var(--app-hover-color);
    border-color: #4caf50;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px var(--app-shadow-color);
}

.preset-button.active {
    background: #e8f5e8;
    border-color: #4caf50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.preset-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.preset-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}

.preset-name {
    font-weight: bold;
    font-size: 14px;
    color: var(--app-text-color);
}

.preset-value {
    font-family: monospace;
    font-size: 12px;
    color: var(--app-secondary-text-color);
    background: var(--app-hover-color);
    padding: 2px 6px;
    border-radius: 3px;
}

.preset-desc {
    font-size: 12px;
    color: var(--app-secondary-text-color);
    margin-bottom: 4px;
}

.preset-size {
    font-size: 11px;
    color: var(--app-secondary-text-color);
    font-style: italic;
}

.compression-estimate {
    background: #f0f8ff;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #cce7ff;
}

.compression-estimate h4 {
    margin: 0 0 12px 0;
    color: #1976d2;
}

.estimate-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
}

.estimate-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    background: white;
    border-radius: 4px;
    border: 1px solid #e3f2fd;
}

.estimate-item i {
    color: #1976d2;
    font-size: 18px;
    width: 20px;
    text-align: center;
}

.estimate-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.estimate-label {
    font-size: 11px;
    color: var(--app-secondary-text-color);
    text-transform: uppercase;
}

.estimate-value {
    font-size: 13px;
    font-weight: bold;
    color: #1976d2;
}

.error-message {
    color: #d9534f;
    background: #f9d6d5;
    padding: 12px;
    border-radius: 4px;
    border: 1px solid #d9534f;
    font-size: 14px;
    font-weight: bold;
    text-align: center;
}

@media (max-width: 600px) {
    .preset-buttons {
        grid-template-columns: 1fr;
    }

    .estimate-grid {
        grid-template-columns: 1fr;
    }
}
</style>
