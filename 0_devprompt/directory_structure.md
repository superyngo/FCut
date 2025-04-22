# Directory Structure

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
