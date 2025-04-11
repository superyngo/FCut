我想基於ffmpeg開發一個輕鬆自動剪輯影片跨平台APP。需求是：UI使用WEB前端框架，業務使用python或rust。業務部份已使用python開發完畢(ffmpeg_toolkit)，現在我需要開發UI，並考慮先使用pywebview，以便之後可移植到rust tauri或web端。

請問實現這種拖拽式工作流設計工具的最佳前端技術棧是什麼？需要支持：
1. 可適應不同裝置大小
2. 方便移植
3. 可輕鬆嫁接不同後端框架(python或rust)
4. 支援i18n
5. 可切換明暗主題
6. 可輕易以compnent的方式來增加/移除功能(頁面)
6. 優考慮使用vite+vue來開發

