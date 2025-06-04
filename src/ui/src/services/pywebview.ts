export async function waitForPyWebviewApi(timeout = 3000): Promise<boolean> {
  const start = Date.now();
  while (typeof window.pywebview?.api === "undefined") {
    await new Promise((r) => setTimeout(r, 100));
    if (Date.now() - start > timeout) {
      console.warn(
        "[PyWebview] API not available within timeout, continuing without it"
      );
      return false;
    }
  }
  return true;
}

class _MockPywebview {
  api = {
    get_constants: async () => ({}),
    logger_debug: (message: string) => console.log(`[Mock Debug] ${message}`),
    logger_error: (message: string) => console.error(`[Mock Error] ${message}`),
    logger_warn: (message: string) => console.warn(`[Mock Warning] ${message}`),
    logger_info: (message: string) => console.info(`[Mock Info] ${message}`),
    open_file_dialog: async () => ["C:\\test\\video.mp4"],
    open_folder_dialog: async () => "C:\\Users\\user\\Downloads",
    get_default_downloads_path: async () => "C:\\Users\\user\\Downloads",
  };
}

// Tell TypeScript about the pywebview property on window
declare global {
  interface Window {
    pywebview?: any;
  }
}

export const pywebview = (await waitForPyWebviewApi())
  ? window.pywebview
  : new _MockPywebview();
