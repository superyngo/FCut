import { waitForPyWebviewApi } from "./services/pywebview";
import { injectMockPywebview } from "./services/pywebview-mock";
import { createApp } from "vue";
import { pinia } from "./stores/piniaInstance";
import App from "./App.vue";
import "./style.css";
import i18n from "./i18n";

// 在開發模式下注入模擬的 pywebview API
if (import.meta.env.DEV) {
  injectMockPywebview();
}

await waitForPyWebviewApi();

const app = createApp(App);

app.use(pinia);
app.use(i18n);

app.mount("#app");
