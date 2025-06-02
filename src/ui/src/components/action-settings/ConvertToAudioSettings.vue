<template>
    <div class="convert-audio-settings">
        <div class="form-group">
            <label for="audio-quality">音訊品質</label>
            <div class="range-container">
                <input id="audio-quality" type="range" v-model.number="audioQuality" :min="minQuality" :max="maxQuality"
                    :step="1" :disabled="disabled" class="quality-range" />
                <span class="quality-value">{{ audioQuality }}</span>
            </div>
            <div class="quality-scale">
                <span class="scale-label">最高品質</span>
                <span class="scale-label">平衡</span>
                <span class="scale-label">最小檔案</span>
            </div>
            <div class="quality-description">
                {{ getQualityDescription() }}
            </div>
        </div>

        <div class="format-selection">
            <h4>輸出格式</h4>
            <div class="format-buttons">
                <button v-for="format in audioFormats" :key="format.ext" @click="selectFormat(format)"
                    :disabled="disabled" :class="{ active: selectedFormat.ext === format.ext }" class="format-button">
                    <div class="format-icon">
                        <i :class="format.icon"></i>
                    </div>
                    <div class="format-info">
                        <span class="format-name">{{ format.name }}</span>
                        <span class="format-ext">.{{ format.ext }}</span>
                    </div>
                    <div class="format-desc">{{ format.description }}</div>
                </button>
            </div>
        </div>

        <div class="advanced-options">
            <h4>進階選項</h4>
            <div class="options-grid">
                <div class="form-group">
                    <label for="sample-rate">取樣率 (Hz)</label>
                    <select id="sample-rate" v-model="sampleRate" :disabled="disabled" class="select-input">
                        <option value="22050">22,050 Hz (語音)</option>
                        <option value="44100">44,100 Hz (CD品質)</option>
                        <option value="48000">48,000 Hz (專業)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="channels">聲道</label>
                    <select id="channels" v-model="channels" :disabled="disabled" class="select-input">
                        <option value="1">單聲道</option>
                        <option value="2">立體聲</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>
                        <input type="checkbox" v-model="normalizeAudio" :disabled="disabled" />
                        音量標準化
                    </label>
                    <small>自動調整音量到適當水平</small>
                </div>

                <div class="form-group">
                    <label>
                        <input type="checkbox" v-model="removeVideo" :disabled="disabled" />
                        移除影片軌道
                    </label>
                    <small>只保留音軌，減少檔案大小</small>
                </div>
            </div>
        </div>

        <!-- 動態估算 -->
        <div class="conversion-estimate">
            <h4>轉換預估</h4>
            <div class="estimate-grid">
                <div class="estimate-item">
                    <i class="fas fa-file-audio"></i>
                    <div class="estimate-info">
                        <span class="estimate-label">輸出格式</span>
                        <span class="estimate-value">{{ selectedFormat.name }}</span>
                    </div>
                </div>
                <div class="estimate-item">
                    <i class="fas fa-compress-arrows-alt"></i>
                    <div class="estimate-info">
                        <span class="estimate-label">預期大小</span>
                        <span class="estimate-value">{{ estimatedSize }}</span>
                    </div>
                </div>
                <div class="estimate-item">
                    <i class="fas fa-headphones"></i>
                    <div class="estimate-info">
                        <span class="estimate-label">適用場景</span>
                        <span class="estimate-value">{{ getUsageScenario() }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 靜態說明 -->
        <div class="info-section">
            <h4>品質等級說明</h4>
            <div class="info-grid">
                <div class="info-item">
                    <span class="quality-level">0-1</span>
                    <span>最高品質，適合音樂或重要音訊</span>
                </div>
                <div class="info-item">
                    <span class="quality-level">2-4</span>
                    <span>高品質，適合語音內容</span>
                </div>
                <div class="info-item">
                    <span class="quality-level">5-6</span>
                    <span>標準品質，平衡品質與檔案大小</span>
                </div>
                <div class="info-item">
                    <span class="quality-level">7-9</span>
                    <span>較低品質，適合語音或儲存空間有限</span>
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

const props = defineProps<ActionSettingsProps>();
const emit = defineEmits<ActionSettingsEmits>()

const audioQuality = ref<number>(6);
const sampleRate = ref<string>("44100");
const channels = ref<string>("2");
const normalizeAudio = ref<boolean>(false);
const removeVideo = ref<boolean>(true);

const minQuality = 0;
const maxQuality = 9;
const validationError = ref<string>('');

// 音訊格式選項
const audioFormats = [
    {
        name: 'MP3',
        ext: 'mp3',
        icon: 'fas fa-music',
        description: '廣泛支援，適合音樂'
    },
    {
        name: 'AAC',
        ext: 'aac',
        icon: 'fas fa-volume-up',
        description: '高效壓縮，現代標準'
    },
    {
        name: 'OGG',
        ext: 'ogg',
        icon: 'fas fa-file-audio',
        description: '開源格式，高品質'
    },
    {
        name: 'WAV',
        ext: 'wav',
        icon: 'fas fa-wave-square',
        description: '無損格式，檔案較大'
    },
    {
        name: 'FLAC',
        ext: 'flac',
        icon: 'fas fa-compact-disc',
        description: '無損壓縮，音樂愛好者'
    }
];

const selectedFormat = ref(audioFormats[0]); // 預設選擇MP3

// 獲取品質描述
const getQualityDescription = (): string => {
    if (audioQuality.value <= 1) {
        return '最高品質，適合音樂錄音或重要音訊內容';
    } else if (audioQuality.value <= 4) {
        return '高品質，適合語音內容或音樂';
    } else if (audioQuality.value <= 6) {
        return '標準品質，平衡品質與檔案大小的最佳選擇';
    } else {
        return '較低品質，適合語音或儲存空間有限的情況';
    }
};

// 估計檔案大小
const estimatedSize = computed((): string => {
    const qualityMultiplier = (9 - audioQuality.value) / 9; // 品質越高倍數越大
    const formatMultiplier = selectedFormat.value.ext === 'wav' ? 10 :
        selectedFormat.value.ext === 'flac' ? 6 : 1;
    const channelMultiplier = parseInt(channels.value);

    const baseSize = 1; // 基礎大小 (MB/分鐘)
    const estimatedSizeMB = baseSize * qualityMultiplier * formatMultiplier * channelMultiplier;

    if (estimatedSizeMB < 0.1) return '< 0.1 MB/分鐘';
    if (estimatedSizeMB < 1) return `${estimatedSizeMB.toFixed(1)} MB/分鐘`;
    return `${estimatedSizeMB.toFixed(0)} MB/分鐘`;
});

// 獲取使用場景
const getUsageScenario = (): string => {
    if (selectedFormat.value.ext === 'wav' || selectedFormat.value.ext === 'flac') {
        return '專業音訊';
    } else if (audioQuality.value <= 2) {
        return '音樂聆聽';
    } else if (audioQuality.value <= 6) {
        return '一般用途';
    } else {
        return '語音內容';
    }
};

// 選擇格式
const selectFormat = (format: any) => {
    selectedFormat.value = format;
};

// 驗證設定
const validate = (): { valid: boolean; message?: string } => {
    if (audioQuality.value < minQuality || audioQuality.value > maxQuality) {
        return {
            valid: false,
            message: `音訊品質必須在 ${minQuality} 到 ${maxQuality} 之間`
        };
    }

    return { valid: true };
};

// 重置設定
const reset = () => {
    audioQuality.value = 6;
    sampleRate.value = "44100";
    channels.value = "2";
    normalizeAudio.value = false;
    removeVideo.value = true;
    selectedFormat.value = audioFormats[0];
};

// 獲取設定值
const getSettings = () => {
    return {
        quality: audioQuality.value,
        format: selectedFormat.value.ext,
        sampleRate: sampleRate.value,
        channels: channels.value,
        normalize: normalizeAudio.value,
        removeVideo: removeVideo.value
    };
};

// 監聽設定變化
watch([audioQuality, selectedFormat, sampleRate, channels, normalizeAudio, removeVideo], () => {
    const validation = validate();
    if (!validation.valid) {
        validationError.value = validation.message || '';
        emit('validation-error', validation.message || '');
    } else {
        validationError.value = '';
        emit('validation-error', '');
    }
    emit('update:settings', getSettings());
}, { deep: true });

// 初始化
onMounted(() => {
    if (props.task?.settings && props.task.renderMethod) {
        // 直接從新的簡化設定格式載入
        const settings = props.task.settings[props.task.renderMethod];
        if (settings) {
            audioQuality.value = settings.quality ?? 6;
            // 其餘欄位也要正確還原
            const foundFormat = audioFormats.find(f => f.ext === settings.format);
            if (foundFormat) {
                selectedFormat.value = foundFormat;
            } else {
                selectedFormat.value = audioFormats[0];
            }
            sampleRate.value = settings.sampleRate ?? "44100";
            channels.value = settings.channels ?? "2";
            normalizeAudio.value = settings.normalize ?? false;
            removeVideo.value = settings.removeVideo ?? true;
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
.convert-audio-settings {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-group label {
    font-weight: bold;
    color: #333;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.range-container {
    display: flex;
    align-items: center;
    gap: 12px;
}

.quality-range {
    flex: 1;
    height: 6px;
    background: linear-gradient(to right, #4caf50, #2196f3, #ff9800);
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
    background: #333;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.quality-range::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #333;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.quality-value {
    font-weight: bold;
    font-size: 16px;
    color: #333;
    min-width: 30px;
    text-align: center;
    font-family: monospace;
}

.quality-scale {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #888;
    margin-top: 4px;
}

.quality-description {
    font-size: 13px;
    color: #666;
    font-style: italic;
    padding: 8px 12px;
    background: #f8f9fa;
    border-radius: 4px;
    border-left: 3px solid #2196f3;
}

.format-selection h4 {
    margin: 0 0 12px 0;
    color: #333;
}

.format-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 8px;
}

.format-button {
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
}

.format-button:hover:not(:disabled) {
    background: #f8f9fa;
    border-color: #2196f3;
    transform: translateY(-1px);
}

.format-button.active {
    background: #e3f2fd;
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.format-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.format-icon {
    font-size: 20px;
    color: #2196f3;
    margin-bottom: 6px;
}

.format-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 4px;
}

.format-name {
    font-weight: bold;
    font-size: 13px;
    color: #333;
}

.format-ext {
    font-family: monospace;
    font-size: 11px;
    color: #666;
}

.format-desc {
    font-size: 10px;
    color: #888;
}

.info-section {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}

.info-section h4 {
    margin: 0 0 12px 0;
    color: #333;
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

.quality-level {
    font-family: monospace;
    font-weight: bold;
    color: #666;
    min-width: 40px;
}

.advanced-options {
    border-top: 1px solid #eee;
    padding-top: 16px;
}

.advanced-options h4 {
    margin: 0 0 12px 0;
    color: #333;
}

.options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
}

.select-input {
    padding: 6px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    background: white;
}

input[type="checkbox"] {
    margin-right: 8px;
}

small {
    font-size: 11px;
    color: #888;
    font-style: italic;
    margin-top: 4px;
    display: block;
}

.conversion-estimate {
    background: #f0f8ff;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #cce7ff;
}

.conversion-estimate h4 {
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
    color: #2196f3;
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
    color: #666;
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
    margin-top: 12px;
}

@media (max-width: 600px) {
    .format-buttons {
        grid-template-columns: repeat(2, 1fr);
    }

    .options-grid {
        grid-template-columns: 1fr;
    }

    .estimate-grid {
        grid-template-columns: 1fr;
    }
}
</style>
