## 專案目錄結構

```text
├── .vscode
│   └── extensions.json
├── README.md
├── index.html
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js
├── public
│   └── vite.svg
├── snapshot.md
├── src
│   ├── .eslintrc.js
│   ├── App.vue
│   ├── assets
│   │   ├── base.css
│   │   ├── checkbox-checked.svg
│   │   ├── checkbox-default.svg
│   │   ├── checkbox-hover.svg
│   │   └── vue.svg
│   ├── components
│   │   ├── AppModals.vue
│   │   ├── MenuOptions.vue
│   │   ├── TaskList.vue
│   │   ├── TaskSettingsForm.vue
│   │   └── TopBar.vue
│   ├── main.ts
│   ├── models
│   │   ├── BaseModel.ts
│   │   ├── elements.ts
│   │   ├── tasks.ts
│   │   └── test.ts
│   ├── services
│   │   └── pywebview.ts
│   ├── stores
│   │   ├── archived
│   │   │   ├── keyStore.ts
│   │   │   └── mouseXY.ts
│   │   └── stores.ts
│   ├── style.css
│   ├── utils
│   │   ├── keyEvents.ts
│   │   ├── logger.ts
│   │   ├── mouseEvents.ts
│   │   └── proxy.ts
│   ├── views
│   │   └── MainView.vue
│   └── vite-env.d.ts
├── tailwind.config.js
├── test
│   └── App_test.vue
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## 函式清單

### src\services\pywebview.ts
- **waitForPyWebviewApi(timeout = 3000)**

### src\stores\archived\keyStore.ts
- **useKeyListener()**

### src\stores\archived\mouseXY.ts
- **useMouseTracking()**

### src\stores\stores.ts
- **useAppStateInit()**
- **useTasksBoundEvents()**
- **useModalStore(defineStore("modalStore", ()** - 使用組合式 API 定義 Modal store

### src\utils\keyEvents.ts
- **keysState()** - 獲取當前按鍵狀態
- **removeKeyCallbacks(obj: Record<string, string | string[]>)** - 精確移除回調

### src\utils\mouseEvents.ts
- **onClick(callbackConfig: CallbackConfig)**
- **onMouseup(callbackConfig: CallbackConfig)**
- **onWheel(callbackConfig: CallbackConfig)**
- **coordinate()**
- **hoveredElements()**
- **isHovering(element: HTMLElement | string)**
- **allCallbacks()**
- **clearCallbacks()**
- **setLowPowerMode(enable: boolean, frequency: number = 30)**

## 依賴清單

## ui

### devDependencies
```json
{
  "@tailwindcss/postcss": "^4.1.4",
  "@types/lodash-es": "^4.17.12",
  "@vitejs/plugin-vue": "^5.2.3",
  "@vue/eslint-config-typescript": "^14.5.0",
  "@vue/tsconfig": "^0.7.0",
  "autoprefixer": "^10.4.21",
  "eslint": "^9.25.1",
  "eslint-plugin-vue": "^10.0.0",
  "postcss": "^8.5.3",
  "tailwindcss": "^4.1.4",
  "typescript": "~5.7.3",
  "vite": "^6.3.2",
  "vue-tsc": "^2.2.10"
}
```

### dependencies
```json
{
  "@tailwindcss/forms": "^0.5.10",
  "lodash-es": "^4.17.21",
  "pinia": "^3.0.2",
  "vue": "^3.5.13"
}
```

