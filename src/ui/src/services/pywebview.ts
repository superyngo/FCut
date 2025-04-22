export async function waitForPyWebviewApi(timeout = 3000): Promise<boolean> {
  const start = Date.now();
  while (typeof window.pywebview?.api === "undefined") {
    await new Promise((r) => setTimeout(r, 100));
    if (Date.now() - start > timeout) return false;
  }
  return true;
}

class _Pywebview {}

// Tell TypeScript about the pywebview property on window
declare global {
  interface Window {
    pywebview?: any;
  }
}

export const pywebview = (await waitForPyWebviewApi())
  ? window.pywebview
  : _Pywebview;
