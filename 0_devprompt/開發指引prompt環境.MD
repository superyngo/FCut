# FCut 開發環境搭建

## 技術架構

### 前後端分離架構
- 使用 `pywebview` 作為橋接 Python 後端與前端 UI 的工具。
- 明確定義 Python 後端和前端之間的 API 介面，便於後續移植到其他平台。

### 前端技術選型
- 使用 Vue 3 + TypeScript 開發前端。
- 配套技術：Vite、Vue Router、Pinia、Tailwind CSS。
- 國際化：使用 Vue I18n 實現多語言支持。

### 後端技術選型
- 使用 Python 開發後端業務邏輯。
- 使用 `uv` 管理套件和環境。
- 國際化：使用 Python 的 `gettext` 或專門的 i18n 庫。

### 打包與發布
- 使用 winget 安裝Windows系統依賴軟體
- 使用 Nuitka 將 Python 程式編譯為 Windows 執行檔。
- 封裝成 MSIX 安裝檔以便上架 Microsoft Store。

---

## 項目結構與工作流程

### 資料夾結構
```
FCut/
├── backend/               # Python 後端
│   ├── core/              # 核心業務邏輯
│   │   ├── processors/    # 各種影片處理器
│   │   ├── queue/         # 任務佇列管理
│   │   └── utils/         # 通用工具函數
│   ├── api/               # API 端點定義
│   ├── models/            # 資料模型
│   └── locales/           # 後端國際化文字
├── frontend/              # 前端應用
│   ├── src/
│   │   ├── assets/        # 靜態資源
│   │   ├── components/    # Vue 元件
│   │   │   ├── base/      # 基礎元件類別
│   │   │   ├── common/    # 通用元件
│   │   │   └── features/  # 功能專用元件
│   │   ├── layouts/       # 布局元件
│   │   ├── pages/         # 頁面元件
│   │   ├── stores/        # Pinia 狀態管理
│   │   │   └── i18n.ts    # i18n 狀態管理
│   │   ├── i18n/          # 國際化相關
│   │   │   ├── index.ts   # i18n 配置和實例
│   │   │   └── locales/   # 翻譯文檔
│   │   ├── types/         # TypeScript 類型定義
│   │   ├── router/        # Vue Router 設定
│   │   ├── styles/        # 全局樣式
│   │   └── utils/         # 前端工具函數
│   ├── public/            # 靜態檔案
│   ├── index.html
│   ├── vite.config.ts     # Vite 配置
│   └── package.json       # 前端依賴
├── shared/                # 前後端共用程式碼
│   ├── types/             # 共用類型定義
│   └── i18n/              # 共用的國際化資源
├── tests/                 # 測試相關
│   ├── backend/           # 後端測試
│   └── frontend/          # 前端測試
├── scripts/               # 構建與部署腳本
│   ├── build.py           # 構建腳本
│   ├── package_msix.py    # MSIX 打包腳本
│   └── extract_i18n.py    # 提取需翻譯文字的工具腳本
├── dist/                  # 建構輸出目錄
├── resources/             # 應用資源
├── docs/                  # 專案文檔
├── main.py                # 應用入口點
├── pyproject.toml         # Python 專案設定
└── README.md              # 專案說明
```

### 工作流程

1. **後端 API 搭建**
   - 搭建 pywebview 開發環境
   - 定義清晰的 API 介面，使用 pywebview 內建工具。
   - 實現業務邏輯功能的封裝，並提供對應的 API。
   - 先定義測試用 API 驗證程式可執行

2. **前端 UI 開發**
   - 搭建 Vue3 開發環境
   - 使用 Vue 3 和 Tailwind CSS 快速構建 UI 原型。
   - 先定義測試用頁面驗證程式可執行


3. **測試前後端整合及程式可執行**
   - 測試可執行 `pywebview` 啟動程式，渲染前端，並通過 API 與後端通信。


---

## 國際化與本地化

### 前端國際化
- 使用 Vue I18n 實現語言切換。
- 在 Pinia store 中管理當前語言設置。

### 後端國際化
- 使用 `gettext` 管理翻譯文字。
- 將所有用戶可見訊息納入翻譯範圍。

---

## 未來規劃

1. **跨平台支持**：
   - 移植到 Linux 和 macOS 平台。
   - 探索使用 Tauri 或其他技術以支援移動端和 Web 端。

2. **效能優化**：
   - 使用 GPU 加速處理大檔案。
   - 優化多任務佇列的執行效率。

3. **AI 功能集成**：
   - 使用 AI 技術進行影片內容分析，例如自動生成字幕或標籤。
   - 提供智能剪輯建議，根據內容自動選擇最佳剪輯點。

4. **社群功能**：
   - 支援用戶分享處理模板或設定。
   - 提供雲端同步功能，保存用戶設置和處理記錄。

5. **插件系統**：
   - 開放插件接口，允許用戶擴展功能。
   - 提供官方插件市場，方便下載和安裝。

6. **安全性增強**：
   - 增加檔案加密功能，保護用戶隱私。
   - 提供處理記錄的刪除選項，確保數據安全。

---

## 後續步驟
1. 建立詳細的技術規格文件。
2. 創建低保真原型或線框圖驗證 UI 流程。
3. 定義開發里程碑和時間表.