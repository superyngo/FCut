import { pywebview } from "../services/api";

export class Logger {
  static error(message: string): void {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
    pywebview.api.logger_error(message);
  }

  static warning(message: string): void {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
    pywebview.api.logger_warning(message);
  }

  static info(message: string): void {
    console.info(`[INFO] ${new Date().toISOString()}: ${message}`);
    pywebview.api.logger_info(message);
  }
}
