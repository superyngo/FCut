import { waitForPyWebviewApi } from "./services/pywebview";
import { createApp } from "vue";
import { pinia } from "./stores/piniaInstance";
import App from "./App.vue";
import "./style.css";

await waitForPyWebviewApi();

const app = createApp(App);

app.use(pinia);
app.mount("#app");
