class _Pywebview {}

// Tell TypeScript about the pywebview property on window
declare global {
  interface Window {
    pywebview?: any;
  }
}
export const pywebview = window.pywebview || _Pywebview;
