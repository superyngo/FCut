import { waitForPyWebviewApi } from "./services/pywebview";
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./style.css";

await waitForPyWebviewApi();

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount("#app");
