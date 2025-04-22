# FCut 開發環境搭建

## 技術架構

### 前後端分離架構

- 優先考慮打包成單一可執行 APP
- 優先針對 Windows 平台打包成 msix 安裝檔
- 考慮未來跨平台移植方便性

### 後端技術選型

- 使用 `uv` 管理套件和環境。
- 使用 Python 包裹完整 APP，包括啟動前後端環境，也易於打包成單一執行檔 APP。
- 使用 `uvicorn` 及 `fastapi` 在後台啟動前端。
- 使用 `pywebview` 啟動前端視窗並橋接 Python 後端與前端 UI 。
- 國際化：使用 Python 的 `gettext` 或專門的 i18n 庫。

### 前端技術選型

- 使用 `pnpm` 管理套件和環境。
- 使用 Vite + Vue 3 + TypeScript 開發前端及 build。
- 配套技術：Vite、Pinia、Tailwind CSS。
- 國際化：使用 Vue I18n 實現多語言支持。

### 打包與發布

- 使用 GitHub Action 自動化 build 程序，是否致行 build 則根據 pyproject.toml 內的 FCut 版本號是否有更新而定。
- 使用 vite 將 ui build 成網頁
- 使用 Nuitka 將 Python 程式編譯為 Windows 執行檔(包含 ui 檔案)。
- 封裝成 MSIX 安裝檔以便上架 Microsoft Store。

---

## 項目結構與工作流程

### 資料夾結構

```
f:/FCut/                     # 專案根目錄
├── .github/                 # GitHub ACTIONS 工作流程設定
│   └── workflows/           # 工作流程定義檔目錄
│       └── build.yml        # 範例：建置與測試工作流程
├── .vscode/                 # VS Code 編輯器設定
│   └── settings.json        # VS Code 工作區設定
├── bin/                     # 存放外部二進制工具
│   └── ffmpeg               # FFmpeg 執行檔 (或 ffmpeg.exe 等)
├── dist/                    # 建置後的產出檔案目錄
│   └── msix                 # Windows平台msix安裝檔
├── docs/                    # 專案文件目錄
├── locales/                 # 國際化語言檔案目錄 (合併後範例)
├── resources/               # 靜態資源檔案目錄 (圖片、字型等)
├── scripts/                 # 建置、部署等自動化腳本
│   ├── build.py             # 建置腳本(含前後端)
│   ├── extract_i18n.py      # 提取國際化字串腳本
│   └── package_msix.py      # 打包為 MSIX 格式腳本
├── src/                     # 原始碼目錄
│   ├── backend/             # 後端應用程式碼
│   │   ├── api/             # API 接口相關程式碼
│   │   ├── core/            # 核心業務邏輯
│   │   │   ├── processors/  # 資料處理相關模組
│   │   │   ├── queue/       # 佇列處理相關模組
│   │   │   └── utils/       # 工具函式模組
│   │   └── models/          # 資料庫模型或資料結構定義
│   │   └── app.py           # pywebview 進入點
│   ├── shared/              # 前後端共用程式碼
│   │   └── types/           # 共用的型別定義
│   │   └── my_logger/       # 共用的logger
│   │   └── constants.py     # 共用的App參數設定
│   └── ui/                  # 前端 UI 應用程式碼 (Vue)
│       ├── index.html       # 前端應用程式進入點 HTML
│       ├── package.json     # Node.js 專案設定檔 (依賴管理)
│       ├── pnpm-lock.yaml   # pnpm 鎖定依賴版本檔案
│       ├── README.md        # 前端專案說明文件
│       ├── vite.config.js   # Vite 建置工具設定檔
│       ├── public/          # 前端靜態公共資源 (會直接複製到 dist)
│       │   └── vite.svg     # Vite 範例 SVG 圖檔
│       ├── src/             # 前端原始碼
│       │   ├── App.vue      # Vue 根組件
│       │   ├── main.js      # Vue 應用程式進入點 JS
│       │   ├── style.css    # 全域 CSS 樣式
│       │   ├── assets/      # 前端資源檔 (會被 Vite 處理)
│       │   │   └── vue.svg  # Vue 範例 SVG 圖檔
│       │   └── components/  # Vue 可複用組件
│       │       └── HelloWorld.vue # 範例 Vue 組件
│       ├── dist/            # 建置後的UI產出檔案目錄
│       └── tests/           # 前端測試程式碼 (單元/組件測試)
├── tests/                   # 測試程式碼主目錄
│   └── backend/             # 後端測試程式碼 (整合/單元測試)
├── main.py                  # App應用程式主進入點(啟動ui及backend)
├── pyproject.toml           # Python 專案設定檔 (PEP 621)
├── README.md                # 專案根說明文件
└── uv.lock                  # uv (Python 套件管理器) 鎖定依賴版本檔案
```

### 工作流程

1. **後端 API 搭建**

   - 啟動 uv 環境
   - 搭建 pywebview 開發環境
   - 安裝執行依賴套件 pydantic、ffmpeg_toolkit、uvicorn 及 fastapi 及其他
   - 安裝開發依賴套件 nuitka

2. **前端 UI 開發**

   - 啟動 pnpnm 及 vite 環境
   - 搭建 Vue3 開發環境
   - 執行 build

3. **測試前後端整合及程式可執行**
   - 測試可執行 `pywebview` 啟動程式，渲染前端(位於 ui/dist)，並通過 API 與後端通信。

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

1. 完善前端頁面
2. 完善業務邏輯
3. 建立詳細的技術規格文件。
