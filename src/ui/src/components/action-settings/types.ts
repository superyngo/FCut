// 定義ACTION設定組件的共用類型和接口
export interface ActionSettingsProps {
  // 當前選中的任務
  task: any;
  // 是否禁用編輯（任務進行中時）
  disabled?: boolean;
}

export interface ActionSettingsEmits {
  // 當設定值改變時發出
  (e: "update:settings", settings: any): void;
  // 驗證失敗時發出
  (e: "validation-error", message: string): void;
}

// 每個ACTION組件都需要實現的基礎方法
export interface ActionComponent {
  // 驗證當前設定是否有效
  validate(): { valid: boolean; message?: string };
  // 重置設定為預設值
  reset(): void;
  // 獲取當前設定值
  getSettings(): any;
}
