var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export function waitForPyWebviewApi() {
    return __awaiter(this, arguments, void 0, function* (timeout = 3000) {
        var _a;
        const start = Date.now();
        while (typeof ((_a = window.pywebview) === null || _a === void 0 ? void 0 : _a.api) === "undefined") {
            yield new Promise((r) => setTimeout(r, 100));
            if (Date.now() - start > timeout)
                return false;
        }
        return true;
    });
}
class _Pywebview {
}
export const pywebview = (await waitForPyWebviewApi())
    ? window.pywebview
    : _Pywebview;
